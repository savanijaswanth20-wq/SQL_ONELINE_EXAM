export interface SqlMcqOptionMap {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface SqlMcqQuestion {
  id: number;
  prompt: string;
  options: SqlMcqOptionMap;
  correctOption: "A" | "B" | "C" | "D";
  category: string;
  explanation: string;
}

export const SQL_MCQ_EXAM_NAME = "SQL MCQ Assessment — 45 Questions";
export const SQL_MCQ_EXAM_DURATION_MS = 45 * 60 * 1000; // 45 minutes
export const TOTAL_MCQ_MARKS = 45;

export const SQL_MCQ_QUESTIONS: SqlMcqQuestion[] = [
  // Category 1: SQL Basics & Concepts (Q1-Q6)
  {
    id: 1,
    category: "SQL Basics & Concepts",
    prompt: "Which statement best describes the fundamental role of SQL in relational database management systems (RDBMS)?",
    options: {
      A: "SQL is a procedural programming language used exclusively for web page design.",
      B: "SQL is a declarative language used to query, define, control, and manipulate structured data.",
      C: "SQL is an operating system command language for managing file systems.",
      D: "SQL is an uncompiled object-oriented framework for desktop graphics rendering.",
    },
    correctOption: "B",
    explanation: "SQL (Structured Query Language) is a domain-specific declarative language designed for managing data held in a relational database management system (RDBMS) via DDL, DML, DCL, and TCL commands.",
  },
  {
    id: 2,
    category: "SQL Basics & Concepts",
    prompt: "How does ANSI SQL handle the comparison of NULL values when using the standard equality operator (=)?",
    options: {
      A: "NULL = NULL evaluates to TRUE.",
      B: "NULL = NULL evaluates to UNKNOWN / NULL, returning no match.",
      C: "NULL = NULL evaluates to FALSE.",
      D: "NULL = NULL throws a syntax compilation error.",
    },
    correctOption: "B",
    explanation: "In SQL three-valued logic, NULL represents an unknown value. Comparing NULL to anything (even another NULL) using '=' yields UNKNOWN (NULL), requiring IS NULL or IS NOT NULL for evaluation.",
  },
  {
    id: 3,
    category: "SQL Basics & Concepts",
    prompt: "Which clause is mandatory in a standard SQL query when retrieving specific columns from a table?",
    options: {
      A: "WHERE",
      B: "FROM",
      C: "GROUP BY",
      D: "ORDER BY",
    },
    correctOption: "B",
    explanation: "The FROM clause specifies the target table or data source from which columns are selected in standard SQL query evaluation.",
  },
  {
    id: 4,
    category: "SQL Basics & Concepts",
    prompt: "What is the primary function of a table alias defined in SQL queries (e.g., FROM employees AS e)?",
    options: {
      A: "To permanently rename the physical database table on disk.",
      B: "To create a temporary copy of table rows in volatile memory.",
      C: "To provide a short or meaningful name for referencing columns in query execution.",
      D: "To restrict user permissions on table access.",
    },
    correctOption: "C",
    explanation: "Table aliases provide short temporary identifier names during query execution, making SQL code cleaner and eliminating column name ambiguity during join operations.",
  },
  {
    id: 5,
    category: "SQL Basics & Concepts",
    prompt: "Which SQL keyword eliminates duplicate rows from a query's result set?",
    options: {
      A: "UNIQUE",
      B: "DISTINCT",
      C: "DIFFERENT",
      D: "SINGLE",
    },
    correctOption: "B",
    explanation: "The DISTINCT keyword (e.g., SELECT DISTINCT department FROM employees) filters out duplicate rows, returning only unique values.",
  },
  {
    id: 6,
    category: "SQL Basics & Concepts",
    prompt: "What will be returned by the query: SELECT 10 + NULL;",
    options: {
      A: "10",
      B: "0",
      C: "NULL",
      D: "An arithmetic overflow error",
    },
    correctOption: "C",
    explanation: "Any arithmetic operation involving a NULL operand results in NULL because an unknown quantity added to 10 remains unknown.",
  },

  // Category 2: Data Types & Table Structure (Q7-Q12)
  {
    id: 7,
    category: "Data Types & Table Structure",
    prompt: "What is the key storage difference between CHAR(10) and VARCHAR(10) in SQL databases?",
    options: {
      A: "CHAR(10) is variable-length up to 10 chars; VARCHAR(10) is fixed 10 chars padded with spaces.",
      B: "CHAR(10) is fixed-length of 10 chars padded with spaces; VARCHAR(10) stores variable length up to 10 chars.",
      C: "CHAR(10) stores numeric values only; VARCHAR(10) stores alphanumeric strings.",
      D: "CHAR(10) supports Unicode; VARCHAR(10) does not support Unicode.",
    },
    correctOption: "B",
    explanation: "CHAR(n) allocates fixed storage space (right-padded with spaces), whereas VARCHAR(n) allocates only the actual string length plus length-prefix bytes.",
  },
  {
    id: 8,
    category: "Data Types & Table Structure",
    prompt: "Which data type is best suited for exact currency and financial calculations without rounding errors?",
    options: {
      A: "FLOAT",
      B: "DOUBLE",
      C: "DECIMAL(10, 2)",
      D: "REAL",
    },
    correctOption: "C",
    explanation: "DECIMAL (or NUMERIC) is an exact fixed-point data type suitable for monetary values where binary floating-point representation errors (inherent to FLOAT/DOUBLE) cannot be tolerated.",
  },
  {
    id: 9,
    category: "Data Types & Table Structure",
    prompt: "Which date/time data type automatically converts time values from local time zone to UTC for storage and back on retrieval in MySQL?",
    options: {
      A: "DATE",
      B: "TIME",
      C: "DATETIME",
      D: "TIMESTAMP",
    },
    correctOption: "D",
    explanation: "TIMESTAMP stores epoch seconds converted to UTC and converts back to local session time zone upon retrieval, whereas DATETIME stores fixed local values as-is.",
  },
  {
    id: 10,
    category: "Data Types & Table Structure",
    prompt: "Which SQL data type allows choosing a single value from a pre-defined static list of permitted strings?",
    options: {
      A: "ENUM",
      B: "SET",
      C: "ARRAY",
      D: "BLOB",
    },
    correctOption: "A",
    explanation: "ENUM is a string object whose value is chosen from a list of permitted values declared when table is created.",
  },
  {
    id: 11,
    category: "Data Types & Table Structure",
    prompt: "Which data type should be used for storing large binary objects such as images, documents, or audio files?",
    options: {
      A: "TEXT",
      B: "BLOB",
      C: "VARCHAR",
      D: "CLOB",
    },
    correctOption: "B",
    explanation: "BLOB (Binary Large Object) holds variable-length binary data (bytes), whereas TEXT stores character string data.",
  },
  {
    id: 12,
    category: "Data Types & Table Structure",
    prompt: "What does INT(11) specify in MySQL table definitions?",
    options: {
      A: "It restricts the integer to 11 bytes of memory storage.",
      B: "It limits the maximum allowable numeric value to 11.",
      C: "It specifies a display width of 11 characters, without affecting value range or storage bytes.",
      D: "It forces the integer to store up to 11 decimal places.",
    },
    correctOption: "C",
    explanation: "In MySQL, the integer display width attribute (e.g. INT(11)) only specifies display formatting (used with ZEROFILL) and does not limit the 4-byte INT storage capacity or numeric range.",
  },

  // Category 3: Constraints & Keys (Q13-Q19)
  {
    id: 13,
    category: "Constraints & Keys",
    prompt: "Which combination of constraints automatically defines a PRIMARY KEY?",
    options: {
      A: "DEFAULT and UNIQUE",
      B: "NOT NULL and UNIQUE",
      C: "CHECK and DEFAULT",
      D: "FOREIGN KEY and CHECK",
    },
    correctOption: "B",
    explanation: "A PRIMARY KEY constraint uniquely identifies each row in a table and implicitly enforces both NOT NULL and UNIQUE integrity rules.",
  },
  {
    id: 14,
    category: "Constraints & Keys",
    prompt: "How many PRIMARY KEY constraints can exist on a single SQL table?",
    options: {
      A: "Unlimited",
      B: "Maximum of 2",
      C: "Exactly 1 (which can consist of multiple columns as a composite key)",
      D: "Up to 5 columns",
    },
    correctOption: "C",
    explanation: "A table can have at most ONE PRIMARY KEY constraint. However, that single primary key can span multiple columns (composite primary key).",
  },
  {
    id: 15,
    category: "Constraints & Keys",
    prompt: "What happens when an INSERT statement omits a column that has a DEFAULT constraint defined?",
    options: {
      A: "The statement fails with a syntax error.",
      B: "The database inserts NULL into the column.",
      C: "The database automatically inserts the pre-defined default value for that column.",
      D: "The transaction is aborted and rolled back.",
    },
    correctOption: "C",
    explanation: "The DEFAULT constraint specifies a default literal or expression to populate a column when no explicit value is supplied in an INSERT statement.",
  },
  {
    id: 16,
    category: "Constraints & Keys",
    prompt: "Which statement accurately describes a FOREIGN KEY constraint?",
    options: {
      A: "It prevents duplicate rows across all tables in a schema.",
      B: "It enforces referential integrity between columns of two tables.",
      C: "It automatically generates sequential auto-incrementing numbers.",
      D: "It encrypts stored column values for cross-table transport.",
    },
    correctOption: "B",
    explanation: "A FOREIGN KEY references a PRIMARY KEY or UNIQUE key in another table (or same table), enforcing referential integrity by ensuring linked data exists.",
  },
  {
    id: 17,
    category: "Constraints & Keys",
    prompt: "What is the primary difference between a UNIQUE constraint and a PRIMARY KEY constraint regarding NULL values?",
    options: {
      A: "UNIQUE constraint allows NULL values (depending on RDBMS, one or multiple NULLs); PRIMARY KEY disallows NULL values completely.",
      B: "PRIMARY KEY allows NULL values; UNIQUE constraint disallows NULL values.",
      C: "Neither constraint permits NULL values under any circumstance.",
      D: "Both constraints automatically convert NULL to zero.",
    },
    correctOption: "A",
    explanation: "Unlike a PRIMARY KEY which strictly disallows NULLs, a UNIQUE constraint allows NULL values (in standard SQL multiple NULLs are permitted because NULL != NULL).",
  },
  {
    id: 18,
    category: "Constraints & Keys",
    prompt: "Which constraint validates that values entered in a column satisfy a boolean condition (e.g., age >= 18)?",
    options: {
      A: "DEFAULT",
      B: "CHECK",
      C: "FOREIGN KEY",
      D: "UNIQUE",
    },
    correctOption: "B",
    explanation: "The CHECK constraint verifies that all values inserted or updated in a column evaluate to TRUE for a specified logical expression.",
  },
  {
    id: 19,
    category: "Constraints & Keys",
    prompt: "What is a candidate key in database normalization theory?",
    options: {
      A: "A column that can only accept foreign key references.",
      B: "A minimal set of attributes that uniquely identifies a tuple in a relation.",
      C: "A key that is proposed by the application developer but ignored by database engine.",
      D: "A non-unique index created for sorting queries.",
    },
    correctOption: "B",
    explanation: "A candidate key is a minimal superkey—a set of one or more columns that uniquely identifies table rows without redundant attributes. One candidate key is chosen as the primary key.",
  },

  // Category 4: DDL Commands (Data Definition) (Q20-Q25)
  {
    id: 20,
    category: "DDL Commands (Data Definition)",
    prompt: "Which category of SQL commands includes CREATE, ALTER, DROP, and TRUNCATE?",
    options: {
      A: "DML (Data Manipulation Language)",
      B: "DDL (Data Definition Language)",
      C: "DCL (Data Control Language)",
      D: "TCL (Transaction Control Language)",
    },
    correctOption: "B",
    explanation: "DDL (Data Definition Language) statements define, alter, and remove database structures, schemas, and table objects.",
  },
  {
    id: 21,
    category: "DDL Commands (Data Definition)",
    prompt: "Which command is used to add a new column to an existing database table?",
    options: {
      A: "UPDATE TABLE employees ADD COLUMN phone VARCHAR(20);",
      B: "ALTER TABLE employees ADD phone VARCHAR(20);",
      C: "MODIFY TABLE employees INSERT COLUMN phone VARCHAR(20);",
      D: "CHANGE TABLE employees ADD phone VARCHAR(20);",
    },
    correctOption: "B",
    explanation: "ALTER TABLE table_name ADD column_name data_type is the standard DDL command to add columns to an existing table.",
  },
  {
    id: 22,
    category: "DDL Commands (Data Definition)",
    prompt: "What is a critical difference between DROP TABLE and TRUNCATE TABLE?",
    options: {
      A: "DROP TABLE deletes rows; TRUNCATE TABLE deletes table structure and rows.",
      B: "TRUNCATE TABLE removes all rows while keeping table structure intact; DROP TABLE removes table definition and all data completely.",
      C: "TRUNCATE TABLE can be filtered with a WHERE clause; DROP TABLE cannot.",
      D: "DROP TABLE triggers ROLLBACK automatically; TRUNCATE TABLE requires explicit COMMIT.",
    },
    correctOption: "B",
    explanation: "TRUNCATE TABLE quickly removes all rows from a table while maintaining the table schema and structure. DROP TABLE deletes both data and table structure from the database catalog.",
  },
  {
    id: 23,
    category: "DDL Commands (Data Definition)",
    prompt: "Which statement alters a column's data type in MySQL?",
    options: {
      A: "ALTER TABLE users MODIFY age SMALLINT;",
      B: "ALTER TABLE users UPDATE age SET SMALLINT;",
      C: "UPDATE TABLE users CHANGE TYPE age SMALLINT;",
      D: "SET COLUMN users.age TO SMALLINT;",
    },
    correctOption: "A",
    explanation: "In MySQL DDL syntax, ALTER TABLE table_name MODIFY column_name new_data_type is used to change column data type definition.",
  },
  {
    id: 24,
    category: "DDL Commands (Data Definition)",
    prompt: "How does TRUNCATE TABLE differ performance-wise from DELETE FROM table_name without a WHERE clause?",
    options: {
      A: "TRUNCATE TABLE is slower because it logs every deleted row individually.",
      B: "TRUNCATE TABLE is faster because it deallocates data pages directly rather than logging individual row deletions.",
      C: "Both execute at identical speeds.",
      D: "DELETE FROM is faster because it bypasses constraint checking.",
    },
    correctOption: "B",
    explanation: "TRUNCATE is a DDL operation that resets table extent allocation and minimal logging, whereas DELETE is DML that scans and logs row-by-row deletions.",
  },
  {
    id: 25,
    category: "DDL Commands (Data Definition)",
    prompt: "Which command completely removes an entire database schema from the server?",
    options: {
      A: "DELETE DATABASE database_name;",
      B: "REMOVE DATABASE database_name;",
      C: "DROP DATABASE database_name;",
      D: "TRUNCATE DATABASE database_name;",
    },
    correctOption: "C",
    explanation: "DROP DATABASE database_name is the DDL command used to permanently drop a database along with all its contained tables and views.",
  },

  // Category 5: DML Commands & Filtering (Q26-Q32)
  {
    id: 26,
    category: "DML Commands & Filtering",
    prompt: "Which clause in an UPDATE statement restricts which rows get modified?",
    options: {
      A: "HAVING",
      B: "WHERE",
      C: "GROUP BY",
      D: "ORDER BY",
    },
    correctOption: "B",
    explanation: "The WHERE clause specifies filtering conditions for UPDATE (and DELETE/SELECT) statements. Omitting WHERE causes ALL rows in the table to be updated.",
  },
  {
    id: 27,
    category: "DML Commands & Filtering",
    prompt: "Which pattern matching wildcard in SQL LIKE clauses represents zero, one, or multiple characters?",
    options: {
      A: "Underscore (_)",
      B: "Percent sign (%)",
      C: "Asterisk (*)",
      D: "Question mark (?)",
    },
    correctOption: "B",
    explanation: "In SQL LIKE clause evaluation, '%' matches any sequence of zero or more characters, whereas '_' matches exactly one single character.",
  },
  {
    id: 28,
    category: "DML Commands & Filtering",
    prompt: "How can you sort query results by salary in descending order, and then by last_name alphabetically?",
    options: {
      A: "ORDER BY salary DESC, last_name ASC",
      B: "ORDER BY salary, last_name DESC",
      C: "SORT BY salary DOWN, last_name UP",
      D: "GROUP BY salary DESC, last_name ASC",
    },
    correctOption: "A",
    explanation: "ORDER BY accepts multiple comma-separated columns with individual sorting direction keywords (ASC for ascending, DESC for descending).",
  },
  {
    id: 29,
    category: "DML Commands & Filtering",
    prompt: "What is the result of executing: DELETE FROM products; (without a WHERE clause)?",
    options: {
      A: "It drops the products table structure.",
      B: "It deletes all records from products table while preserving table structure.",
      C: "It throws a syntax error.",
      D: "It deletes only the first row.",
    },
    correctOption: "B",
    explanation: "DELETE FROM products removes all rows from the table one-by-one. The table schema itself remains intact.",
  },
  {
    id: 30,
    category: "DML Commands & Filtering",
    prompt: "Which SQL operator checks if a value matches any value in a subquery or list of literal values?",
    options: {
      A: "BETWEEN",
      B: "IN",
      C: "LIKE",
      D: "EXISTS",
    },
    correctOption: "B",
    explanation: "The IN operator checks whether a specified column value matches any item in a candidate value list or single-column subquery result.",
  },
  {
    id: 31,
    category: "DML Commands & Filtering",
    prompt: "What does the clause BETWEEN 10 AND 50 evaluate in standard SQL?",
    options: {
      A: "Exclusive range: values strictly greater than 10 and strictly less than 50.",
      B: "Inclusive range: values greater than or equal to 10 and less than or equal to 50.",
      C: "Values equal to 10 or equal to 50 only.",
      D: "Values outside 10 and 50.",
    },
    correctOption: "B",
    explanation: "The BETWEEN operator is inclusive, equivalent to (value >= 10 AND value <= 50).",
  },
  {
    id: 32,
    category: "DML Commands & Filtering",
    prompt: "What is the correct syntax to insert a single new row into a table named departments?",
    options: {
      A: "ADD INTO departments VALUES (10, 'Finance');",
      B: "INSERT INTO departments (dept_id, dept_name) VALUES (10, 'Finance');",
      C: "UPDATE departments SET dept_id=10, dept_name='Finance';",
      D: "CREATE ROW IN departments VALUES (10, 'Finance');",
    },
    correctOption: "B",
    explanation: "INSERT INTO table_name (column_list) VALUES (value_list) is the correct standard SQL DML statement.",
  },

  // Category 6: Joins & Subqueries (Q33-Q39)
  {
    id: 33,
    category: "Joins & Subqueries",
    prompt: "Which join returns all matching records from both tables, plus unmatched rows from the left table with NULLs for right table columns?",
    options: {
      A: "INNER JOIN",
      B: "LEFT JOIN (or LEFT OUTER JOIN)",
      C: "RIGHT JOIN",
      D: "CROSS JOIN",
    },
    correctOption: "B",
    explanation: "A LEFT JOIN returns all rows from the left table. If no matching row exists in the right table, NULL values are returned for right table columns.",
  },
  {
    id: 34,
    category: "Joins & Subqueries",
    prompt: "What type of result set is produced by a CROSS JOIN between Table A (5 rows) and Table B (4 rows)?",
    options: {
      A: "9 rows (sum of rows)",
      B: "20 rows (Cartesian product)",
      C: "5 rows (maximum of either table)",
      D: "0 rows",
    },
    correctOption: "B",
    explanation: "A CROSS JOIN produces a Cartesian product matching every row of Table A with every row of Table B (5 x 4 = 20 rows).",
  },
  {
    id: 35,
    category: "Joins & Subqueries",
    prompt: "What is a correlated subquery in SQL?",
    options: {
      A: "A subquery that executes independently once before the outer query runs.",
      B: "A subquery that references column values from the outer query, executing once for each candidate row processed by outer query.",
      C: "A subquery containing a JOIN clause.",
      D: "A subquery that returns a view definition.",
    },
    correctOption: "B",
    explanation: "A correlated subquery references columns from the outer query block. Because of this dependency, it is logically evaluated once for every row evaluated by outer query.",
  },
  {
    id: 36,
    category: "Joins & Subqueries",
    prompt: "Which SQL operator tests for the existence of rows returned by a subquery?",
    options: {
      A: "IN",
      B: "EXISTS",
      C: "LIKE",
      D: "ANY",
    },
    correctOption: "B",
    explanation: "The EXISTS operator evaluates to TRUE if the subquery returns at least one row, stopping subquery evaluation as soon as a match is found.",
  },
  {
    id: 37,
    category: "Joins & Subqueries",
    prompt: "Which join type returns ONLY rows where join conditions match in BOTH joined tables?",
    options: {
      A: "INNER JOIN",
      B: "FULL OUTER JOIN",
      C: "LEFT JOIN",
      D: "RIGHT JOIN",
    },
    correctOption: "A",
    explanation: "INNER JOIN selects records that have matching values in both tables, omitting rows without a match from either side.",
  },
  {
    id: 38,
    category: "Joins & Subqueries",
    prompt: "How does a FULL OUTER JOIN behave?",
    options: {
      A: "It returns only matching rows present in both tables.",
      B: "It returns all rows from left table and right table, filling NULLs where join conditions do not match.",
      C: "It creates a temporary view across all database tables.",
      D: "It deletes mismatched rows automatically.",
    },
    correctOption: "B",
    explanation: "FULL OUTER JOIN combines the results of both LEFT JOIN and RIGHT JOIN, returning all rows from both tables with NULLs in non-matching places.",
  },
  {
    id: 39,
    category: "Joins & Subqueries",
    prompt: "What is a SELF JOIN in SQL?",
    options: {
      A: "A join performed without an ON clause.",
      B: "A regular join in which a table is joined with itself using table aliases.",
      C: "A join between two identical databases.",
      D: "A subquery inside a WHERE clause.",
    },
    correctOption: "B",
    explanation: "A SELF JOIN joins a table to itself (e.g. employees table joined to employees table to match employee supervisor/manager IDs).",
  },

  // Category 7: Aggregate Functions, Grouping & Control (DCL/TCL) (Q40-Q45)
  {
    id: 40,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "What is the primary operational difference between WHERE and HAVING clauses?",
    options: {
      A: "WHERE filters rows before grouping/aggregation; HAVING filters grouped summary rows after aggregation.",
      B: "HAVING filters individual rows before grouping; WHERE filters aggregated results.",
      C: "WHERE can only be used with SELECT statements; HAVING can be used with UPDATE.",
      D: "Both clauses perform identical functions and can be used interchangeably.",
    },
    correctOption: "A",
    explanation: "WHERE filters raw individual records BEFORE any GROUP BY aggregation takes place. HAVING filters summary records AFTER GROUP BY has aggregated row groups.",
  },
  {
    id: 41,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "Which aggregate function returns the total number of non-NULL values in a specific column?",
    options: {
      A: "COUNT(*)",
      B: "COUNT(column_name)",
      C: "SUM(column_name)",
      D: "TOTAL(column_name)",
    },
    correctOption: "B",
    explanation: "COUNT(column_name) counts all non-NULL entries in the specified column, whereas COUNT(*) counts all rows regardless of NULL values.",
  },
  {
    id: 42,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "Which clause MUST be included when selecting non-aggregated columns alongside aggregate functions like SUM() or AVG()?",
    options: {
      A: "ORDER BY",
      B: "HAVING",
      C: "GROUP BY",
      D: "WHERE",
    },
    correctOption: "C",
    explanation: "When mixing non-aggregated columns with aggregate functions, SQL standard requires grouping by all non-aggregated select list columns in a GROUP BY clause.",
  },
  {
    id: 43,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "Which TCL command permanently saves all transaction changes to the database storage?",
    options: {
      A: "ROLLBACK",
      B: "SAVEPOINT",
      C: "COMMIT",
      D: "GRANT",
    },
    correctOption: "C",
    explanation: "COMMIT is the Transaction Control Language (TCL) command that permanently commits all pending transaction updates to the database disk.",
  },
  {
    id: 44,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "Which TCL command undoes uncommitted database changes made during the current transaction?",
    options: {
      A: "REVOKE",
      B: "ROLLBACK",
      C: "CHECKPOINT",
      D: "ALTER",
    },
    correctOption: "B",
    explanation: "ROLLBACK reverts database state to the beginning of the transaction or to a designated SAVEPOINT, undoing uncommitted changes.",
  },
  {
    id: 45,
    category: "Aggregate Functions, Grouping & Control (DCL/TCL)",
    prompt: "Which category of SQL commands includes GRANT and REVOKE for managing user permissions?",
    options: {
      A: "DCL (Data Control Language)",
      B: "DDL (Data Definition Language)",
      C: "DML (Data Manipulation Language)",
      D: "TCL (Transaction Control Language)",
    },
    correctOption: "A",
    explanation: "DCL (Data Control Language) includes GRANT (bestowing privileges) and REVOKE (removing privileges) to control database security and access rights.",
  },
];
