import alasql from "alasql";
import { DB_SCHEMAS } from "./sql-exam-questions";
import { checkSqlSecurity } from "./sql-exam-types";
import type { SqlQueryResult, QuestionEvaluation, SqlQuestion } from "./sql-exam-types";

// Ensure MySQL dialect mode
alasql.options.mysql = true;

/**
 * Creates an isolated in-memory database populated with seed sample data.
 * Returns the unique database name.
 */
export function createIsolatedDatabase(): string {
  const dbName = "sqlexam_" + Math.random().toString(36).substring(2, 10);
  alasql(`CREATE DATABASE ${dbName};`);
  alasql.use(dbName);

  // Create tables and seed data
  alasql(`
    CREATE TABLE customers (
      customer_id INT PRIMARY KEY,
      customer_name VARCHAR(100),
      email VARCHAR(100),
      city VARCHAR(50)
    );

    CREATE TABLE products (
      product_id INT PRIMARY KEY,
      product_name VARCHAR(100),
      category VARCHAR(50),
      price DECIMAL(10,2),
      stock INT
    );

    CREATE TABLE orders (
      order_id INT PRIMARY KEY,
      customer_id INT,
      order_date DATE,
      total_amount DECIMAL(10,2),
      status VARCHAR(20)
    );

    CREATE TABLE order_items (
      order_item_id INT PRIMARY KEY,
      order_id INT,
      product_id INT,
      quantity INT,
      unit_price DECIMAL(10,2)
    );

    CREATE TABLE employees (
      employee_id INT PRIMARY KEY,
      employee_name VARCHAR(100),
      department VARCHAR(50),
      salary DECIMAL(10,2),
      manager_id INT
    );
  `);

  alasql(`
    INSERT INTO customers VALUES 
      (1, 'Ramesh Kumar', 'ramesh@example.com', 'Bengaluru'),
      (2, 'Priya Sharma', 'priya@example.com', 'Mumbai'),
      (3, 'Anita Roy', 'anita@example.com', 'Bengaluru'),
      (4, 'Suresh Patel', 'suresh@example.com', 'Delhi'),
      (5, 'Vikram Singh', 'vikram@example.com', 'Bengaluru'),
      (6, 'Neha Gupta', 'neha@example.com', 'Chennai');

    INSERT INTO products VALUES 
      (101, 'Laptop Pro', 'Electronics', 55000.00, 15),
      (102, 'Wireless Mouse', 'Accessories', 800.00, 50),
      (103, 'Mechanical Keyboard', 'Accessories', 3500.00, 25),
      (104, 'Gaming Monitor', 'Electronics', 18000.00, 10),
      (105, 'USB-C Cable', 'Accessories', 450.00, 100),
      (106, 'Smartphone X', 'Electronics', 42000.00, 20);

    INSERT INTO orders VALUES 
      (1001, 1, '2024-01-15', 55800.00, 'Completed'),
      (1002, 2, '2024-01-18', 3500.00, 'Completed'),
      (1003, 1, '2024-02-01', 18000.00, 'Shipped'),
      (1004, 3, '2024-02-10', 42450.00, 'Completed'),
      (1005, 4, '2024-02-14', 800.00, 'Pending'),
      (1006, 5, '2024-02-20', 3500.00, 'Completed');

    INSERT INTO order_items VALUES 
      (1, 1001, 101, 1, 55000.00),
      (2, 1001, 102, 1, 800.00),
      (3, 1002, 103, 1, 3500.00),
      (4, 1003, 104, 1, 18000.00),
      (5, 1004, 106, 1, 42000.00),
      (6, 1004, 105, 1, 450.00),
      (7, 1005, 102, 1, 800.00),
      (8, 1006, 103, 2, 3500.00);

    INSERT INTO employees VALUES 
      (1, 'Arjun Reddy', 'Engineering', 120000.00, NULL),
      (2, 'Smriti Mandhana', 'Engineering', 95000.00, 1),
      (3, 'Kavita Verma', 'Marketing', 85000.00, 1),
      (4, 'Rahul Dravid', 'Sales', 90000.00, 1),
      (5, 'Sunil Chhetri', 'Engineering', 75000.00, 2);
  `);

  return dbName;
}

/**
 * Safely executes a user SQL query in a specified or newly created isolated database.
 */
export function executeSqlQuery(sql: string, targetDb?: string): SqlQueryResult {
  const security = checkSqlSecurity(sql);
  if (!security.isSafe) {
    return {
      success: false,
      error: security.reason,
    };
  }

  const db = targetDb || createIsolatedDatabase();
  const startTime = performance.now();

  try {
    alasql.use(db);
    
    // Normalize multi-statement or single statement execution
    const rawResult = alasql(sql);
    const endTime = performance.now();
    const executionTimeMs = Math.round(endTime - startTime);

    let rows: Record<string, unknown>[] = [];
    let affectedRows = 0;

    if (Array.isArray(rawResult)) {
      const last = rawResult[rawResult.length - 1];
      if (typeof last === "number") {
        affectedRows = last;
      } else if (Array.isArray(last)) {
        rows = last as Record<string, unknown>[];
      } else if (rawResult.length > 0 && typeof rawResult[0] === "object") {
        rows = rawResult as Record<string, unknown>[];
      }
    } else if (typeof rawResult === "number") {
      affectedRows = rawResult;
    }

    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    return {
      success: true,
      columns,
      rows,
      rowCount: rows.length,
      affectedRows,
      executionTimeMs,
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `SQL Execution Error: ${errorMsg}`,
    };
  } finally {
    if (!targetDb) {
      try {
        alasql(`DROP DATABASE ${db};`);
      } catch {}
    }
  }
}

/**
 * Normalizes query rows for comparison (handles key casing, key order, float decimals).
 */
function normalizeRows(rows: Record<string, unknown>[] = []): unknown[] {
  return rows.map((row) => {
    const normalized: Record<string, unknown> = {};
    const keys = Object.keys(row).sort();
    for (const key of keys) {
      let val = row[key];
      if (typeof val === "number") {
        val = Math.round(val * 100) / 100;
      }
      normalized[key.toLowerCase()] = val;
    }
    return normalized;
  });
}

/**
 * Deep compares two normalized result sets.
 */
function compareResultSets(actual: Record<string, unknown>[] = [], expected: Record<string, unknown>[] = []): boolean {
  if (actual.length !== expected.length) return false;
  const normActual = normalizeRows(actual);
  const normExpected = normalizeRows(expected);

  for (let i = 0; i < normActual.length; i++) {
    const a = normActual[i] as Record<string, unknown>;
    const e = normExpected[i] as Record<string, unknown>;
    const aKeys = Object.keys(a);
    const eKeys = Object.keys(e);

    if (aKeys.length !== eKeys.length) return false;

    for (let k = 0; k < aKeys.length; k++) {
      const keyA = aKeys[k];
      const valA = a[keyA];
      const valE = e[keyA] ?? e[eKeys[k]]; // Allow column alias difference if values match order

      if (valA !== valE && String(valA) !== String(valE)) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Evaluates a student SQL answer against the hidden expected SQL solution.
 */
export function evaluateQuestion(question: SqlQuestion, studentSql: string): QuestionEvaluation {
  const trimmedStudent = studentSql.trim();

  if (!trimmedStudent) {
    return {
      questionId: question.id,
      isCorrect: false,
      score: 0,
      maxScore: question.points,
      studentSql: "",
      expectedSql: question.expectedSql,
      feedback: "No query submitted.",
    };
  }

  const security = checkSqlSecurity(trimmedStudent);
  if (!security.isSafe) {
    return {
      questionId: question.id,
      isCorrect: false,
      score: 0,
      maxScore: question.points,
      studentSql: trimmedStudent,
      expectedSql: question.expectedSql,
      feedback: security.reason || "Forbidden SQL command.",
    };
  }

  // Create 2 fresh isolated database instances for side-by-side evaluation
  const dbStudent = createIsolatedDatabase();
  const dbExpected = createIsolatedDatabase();

  try {
    const studentRes = executeSqlQuery(trimmedStudent, dbStudent);
    const expectedRes = executeSqlQuery(question.expectedSql, dbExpected);

    if (!studentRes.success) {
      return {
        questionId: question.id,
        isCorrect: false,
        score: 0,
        maxScore: question.points,
        studentSql: trimmedStudent,
        expectedSql: question.expectedSql,
        studentResult: studentRes,
        expectedResult: expectedRes,
        feedback: studentRes.error || "Query failed to execute.",
      };
    }

    let isCorrect = false;

    if (question.isModification) {
      // For INSERT or UPDATE, evaluate database state after modification
      alasql.use(dbStudent);
      if (question.id === 3) {
        // Check if customer_id = 7 exists in student database
        const check = alasql("SELECT * FROM customers WHERE customer_id = 7") as Record<string, unknown>[];
        isCorrect = Array.isArray(check) && check.length === 1 && String(check[0]?.customer_name) === "Kavya Rao";
      } else if (question.id === 4) {
        // Check if stock = 25 for product_id = 101 in student database
        const check = alasql("SELECT stock FROM products WHERE product_id = 101") as Record<string, unknown>[];
        isCorrect = Array.isArray(check) && check.length === 1 && Number(check[0]?.stock) === 25;
      }
    } else {
      // Compare output result sets for SELECT queries
      isCorrect = compareResultSets(studentRes.rows, expectedRes.rows);
    }

    const score = isCorrect ? question.points : 0;
    const feedback = isCorrect
      ? "Correct! Your SQL query returned the exact expected results and passed all test cases."
      : question.isModification
      ? "Incorrect. The database state after running your query did not match expected values."
      : `Incorrect. Expected ${expectedRes.rowCount ?? 0} rows, but your query returned ${studentRes.rowCount ?? 0} rows or mismatched data.`;

    return {
      questionId: question.id,
      isCorrect,
      score,
      maxScore: question.points,
      studentSql: trimmedStudent,
      expectedSql: question.expectedSql,
      studentResult: studentRes,
      expectedResult: expectedRes,
      feedback,
    };
  } finally {
    try {
      alasql(`DROP DATABASE ${dbStudent};`);
      alasql(`DROP DATABASE ${dbExpected};`);
    } catch {}
  }
}
