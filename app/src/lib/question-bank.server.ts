import type {Question} from './exam-types';
export interface KeyQuestion extends Question {answer:string|string[];explanation:string;rubric?:string[]}
export const BANK:KeyQuestion[] = [
  {
    "id": 1,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "You are storing a customer's age. Which is the most appropriate choice from these options?",
    "options": [
      "VARCHAR(3)",
      "INT",
      "TEXT",
      "DECIMAL(10,2)"
    ],
    "answer": "B",
    "explanation": "INT stores whole numbers. TINYINT UNSIGNED may be more compact for age, but INT is the best of the offered choices."
  },
  {
    "id": 2,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "A grocery product costs 149.99. Which data type is generally appropriate for exact monetary values?",
    "options": [
      "FLOAT",
      "DOUBLE",
      "DECIMAL(10,2)",
      "VARCHAR(10)"
    ],
    "answer": "C",
    "explanation": "DECIMAL(10,2) stores exact fixed-point values with two decimal places. FLOAT and DOUBLE are approximate."
  },
  {
    "id": 3,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which is an approximate numeric type?",
    "options": [
      "INT",
      "DECIMAL",
      "DOUBLE",
      "BIGINT"
    ],
    "answer": "C",
    "explanation": "DOUBLE stores approximate floating-point values; integer types and DECIMAL represent exact values within their ranges."
  },
  {
    "id": 4,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which type is designed for variable-length character strings?",
    "options": [
      "CHAR",
      "VARCHAR",
      "BINARY",
      "BIT"
    ],
    "answer": "B",
    "explanation": "VARCHAR stores character strings whose lengths can vary, up to a declared maximum."
  },
  {
    "id": 5,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which type stores binary strings rather than normal character strings?",
    "options": [
      "VARCHAR",
      "TEXT",
      "VARBINARY",
      "ENUM"
    ],
    "answer": "C",
    "explanation": "VARBINARY stores variable-length byte strings, without a character set or character collation."
  },
  {
    "id": 6,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "You need to store a customer's date of birth: 1999-11-27. Which type is most appropriate?",
    "options": [
      "YEAR",
      "DATE",
      "DATETIME",
      "TIME"
    ],
    "answer": "B",
    "explanation": "DATE stores a calendar date without a time of day."
  },
  {
    "id": 7,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "You need to store 2026-09-23 10:30:45. Which is suitable?",
    "options": [
      "DATE",
      "YEAR",
      "DATETIME",
      "TIME"
    ],
    "answer": "C",
    "explanation": "DATETIME stores a date and time. DATE and TIME each store only part of the value."
  },
  {
    "id": 8,
    "section": "A",
    "topic": "Data types",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which type is specifically available for storing JSON documents?",
    "options": [
      "TEXT only",
      "JSON",
      "BLOB only",
      "VARCHAR only"
    ],
    "answer": "B",
    "explanation": "The JSON type validates JSON documents and stores them in MySQL's native JSON representation."
  },
  {
    "id": 9,
    "section": "A",
    "topic": "Constraints",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which constraint uniquely identifies each row in a table?",
    "options": [
      "CHECK",
      "FOREIGN KEY",
      "PRIMARY KEY",
      "DEFAULT"
    ],
    "answer": "C",
    "explanation": "A PRIMARY KEY requires uniqueness and non-NULL values for the key columns."
  },
  {
    "id": 10,
    "section": "A",
    "topic": "Keys",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which statement is correct?",
    "options": [
      "A table can have unlimited primary keys",
      "A table can have only one primary key",
      "A primary key can contain duplicate values",
      "A primary key can normally contain NULL values"
    ],
    "answer": "B",
    "explanation": "A table can have one PRIMARY KEY constraint. It can include one column or several columns."
  },
  {
    "id": 11,
    "section": "A",
    "topic": "Keys",
    "kind": "mcq",
    "points": 1,
    "prompt": "What does a foreign key primarily help maintain?",
    "options": [
      "Sorting",
      "Referential integrity",
      "Data formatting",
      "String length"
    ],
    "answer": "B",
    "explanation": "A foreign key connects related records and checks that a referenced parent key exists, subject to NULL and referential-action rules."
  },
  {
    "id": 12,
    "section": "A",
    "topic": "Constraints",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which constraint prevents a column from containing NULL?",
    "options": [
      "UNIQUE",
      "DEFAULT",
      "NOT NULL",
      "CHECK"
    ],
    "answer": "C",
    "explanation": "NOT NULL makes NULL invalid. It does not make values unique."
  },
  {
    "id": 13,
    "section": "A",
    "topic": "Constraints",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which constraint enforces a business condition such as salary > 0?",
    "options": [
      "CHECK",
      "DEFAULT",
      "PRIMARY KEY",
      "FOREIGN KEY"
    ],
    "answer": "A",
    "explanation": "An enforced CHECK tests a condition. MySQL enforces CHECK constraints from 8.0.16. Add NOT NULL as well if salary is mandatory, because UNKNOWN from NULL passes a CHECK."
  },
  {
    "id": 14,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which command changes the structure of an existing table?",
    "options": [
      "UPDATE",
      "ALTER",
      "INSERT",
      "SELECT"
    ],
    "answer": "B",
    "explanation": "ALTER TABLE changes the definition, for example adding a column or constraint."
  },
  {
    "id": 15,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which command completely removes a table definition?",
    "options": [
      "DELETE",
      "TRUNCATE",
      "DROP",
      "REMOVE"
    ],
    "answer": "C",
    "explanation": "DROP TABLE removes the table definition and its data."
  },
  {
    "id": 16,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which of the following removes all rows while retaining the table's defined structure?",
    "options": [
      "DROP",
      "TRUNCATE",
      "ALTER",
      "RENAME"
    ],
    "answer": "B",
    "explanation": "TRUNCATE TABLE empties the table. In MySQL it is DDL, causes an implicit commit, and is not transactionally rollbackable."
  },
  {
    "id": 17,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which command is used to add new records?",
    "options": [
      "INSERT",
      "UPDATE",
      "ALTER",
      "CREATE"
    ],
    "answer": "A",
    "explanation": "INSERT adds rows to a table."
  },
  {
    "id": 18,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which command changes existing row data?",
    "options": [
      "ALTER",
      "UPDATE",
      "CREATE",
      "RENAME"
    ],
    "answer": "B",
    "explanation": "UPDATE changes existing rows. A WHERE clause restricts which rows are updated."
  },
  {
    "id": 19,
    "section": "A",
    "topic": "Commands",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which command is transaction control?",
    "options": [
      "COMMIT",
      "CREATE",
      "INSERT",
      "ALTER"
    ],
    "answer": "A",
    "explanation": "COMMIT completes the current transaction and makes its changes permanent."
  },
  {
    "id": 20,
    "section": "A",
    "topic": "Keys",
    "kind": "mcq",
    "points": 1,
    "prompt": "Which of these best represents a composite key?",
    "options": [
      "One column with PRIMARY KEY",
      "Two or more columns together forming a key",
      "A foreign key only",
      "A nullable column with UNIQUE"
    ],
    "answer": "B",
    "explanation": "A composite key consists of two or more columns used together."
  },
  {
    "id": 21,
    "section": "B",
    "topic": "Data types",
    "kind": "blank",
    "points": 1,
    "prompt": "The SQL data type used for exact fixed-point numerical values is ______.",
    "answer": [
      "DECIMAL",
      "NUMERIC",
      "DEC",
      "FIXED"
    ],
    "explanation": "DECIMAL is MySQL's exact fixed-point type; NUMERIC, DEC, and FIXED are synonyms."
  },
  {
    "id": 22,
    "section": "B",
    "topic": "Data types",
    "kind": "blank",
    "points": 1,
    "prompt": "______ is generally used when string length can vary.",
    "answer": [
      "VARCHAR"
    ],
    "explanation": "VARCHAR is for variable-length character strings."
  },
  {
    "id": 23,
    "section": "B",
    "topic": "Keys",
    "kind": "blank",
    "points": 1,
    "prompt": "A column that uniquely identifies every row can be defined as a ______ key.",
    "answer": [
      "PRIMARY",
      "PRIMARY KEY"
    ],
    "explanation": "A PRIMARY KEY uniquely identifies rows and cannot contain NULL."
  },
  {
    "id": 24,
    "section": "B",
    "topic": "Keys",
    "kind": "blank",
    "points": 1,
    "prompt": "A key that references a key in another table is called a ______ key.",
    "answer": [
      "FOREIGN",
      "FOREIGN KEY"
    ],
    "explanation": "A FOREIGN KEY enforces a reference to a key. Self-referencing foreign keys within one table are also possible."
  },
  {
    "id": 25,
    "section": "B",
    "topic": "Constraints",
    "kind": "blank",
    "points": 1,
    "prompt": "The constraint that prevents NULL values is ______.",
    "answer": [
      "NOT NULL",
      "NOTNULL"
    ],
    "explanation": "NOT NULL prevents a column from accepting NULL."
  },
  {
    "id": 26,
    "section": "B",
    "topic": "Constraints",
    "kind": "blank",
    "points": 1,
    "prompt": "The clause that supplies a value automatically when the column is omitted is ______.",
    "answer": [
      "DEFAULT"
    ],
    "explanation": "DEFAULT supplies the declared default when a column is omitted or DEFAULT is requested. It does not generally replace an explicitly supplied NULL."
  },
  {
    "id": 27,
    "section": "B",
    "topic": "Commands",
    "kind": "blank",
    "points": 1,
    "prompt": "The command used to add a new column to an existing table is ______.",
    "answer": [
      "ALTER",
      "ALTER TABLE",
      "ALTER TABLE ADD",
      "ALTER TABLE ADD COLUMN"
    ],
    "explanation": "Use ALTER TABLE table_name ADD COLUMN column_name data_type."
  },
  {
    "id": 28,
    "section": "B",
    "topic": "Commands",
    "kind": "blank",
    "points": 1,
    "prompt": "The command used to remove a table and its definition is ______.",
    "answer": [
      "DROP",
      "DROP TABLE"
    ],
    "explanation": "DROP TABLE removes the table itself."
  },
  {
    "id": 29,
    "section": "B",
    "topic": "Commands",
    "kind": "blank",
    "points": 1,
    "prompt": "The command used to permanently save the current transaction is ______.",
    "answer": [
      "COMMIT"
    ],
    "explanation": "COMMIT saves the transaction changes."
  },
  {
    "id": 30,
    "section": "B",
    "topic": "Keys",
    "kind": "blank",
    "points": 1,
    "prompt": "A key consisting of multiple columns is called a ______ key.",
    "answer": [
      "COMPOSITE",
      "COMPOSITE KEY"
    ],
    "explanation": "A composite key uses multiple columns together."
  },
  {
    "id": 31,
    "section": "C",
    "topic": "Data types",
    "kind": "tf",
    "points": 1,
    "prompt": "DECIMAL is generally preferred over floating-point types when exact decimal values are important.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "TRUE",
    "explanation": "DECIMAL stores exact decimal values within its declared precision and scale."
  },
  {
    "id": 32,
    "section": "C",
    "topic": "Keys",
    "kind": "tf",
    "points": 1,
    "prompt": "A table can have multiple primary keys.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "A table has at most one PRIMARY KEY constraint, which may contain several columns."
  },
  {
    "id": 33,
    "section": "C",
    "topic": "Keys",
    "kind": "tf",
    "points": 1,
    "prompt": "A foreign key must always be the primary key of the child table.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "A child foreign key can be a separate column or set of columns and need not be the child's primary key."
  },
  {
    "id": 34,
    "section": "C",
    "topic": "Keys",
    "kind": "tf",
    "points": 1,
    "prompt": "A foreign key can reference a key in another table.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "TRUE",
    "explanation": "Foreign keys can reference keys in a parent table. They can also reference a key in their own table."
  },
  {
    "id": 35,
    "section": "C",
    "topic": "Commands",
    "kind": "tf",
    "points": 1,
    "prompt": "DELETE and DROP perform the same operation.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "DELETE removes selected or all rows. DROP TABLE removes the table definition and data."
  },
  {
    "id": 36,
    "section": "C",
    "topic": "Commands",
    "kind": "tf",
    "points": 1,
    "prompt": "TRUNCATE removes the table structure along with the data.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "TRUNCATE removes all rows but retains the table's definition. MySQL implements this as DDL and implicitly commits."
  },
  {
    "id": 37,
    "section": "C",
    "topic": "Data types",
    "kind": "tf",
    "points": 1,
    "prompt": "VARCHAR and CHAR are identical in how they store character strings.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "CHAR has a fixed declared length and padding behavior; VARCHAR stores variable-length strings. Trailing-space behavior also differs."
  },
  {
    "id": 38,
    "section": "C",
    "topic": "Constraints",
    "kind": "tf",
    "points": 1,
    "prompt": "NOT NULL guarantees uniqueness.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "FALSE",
    "explanation": "NOT NULL prevents NULL values. Use UNIQUE or PRIMARY KEY for uniqueness."
  },
  {
    "id": 39,
    "section": "C",
    "topic": "Constraints",
    "kind": "tf",
    "points": 1,
    "prompt": "A CHECK constraint can enforce conditions on column values.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "TRUE",
    "explanation": "An enforced CHECK can test a condition such as salary > 0. Pair with NOT NULL when the value is mandatory."
  },
  {
    "id": 40,
    "section": "C",
    "topic": "Commands",
    "kind": "tf",
    "points": 1,
    "prompt": "COMMIT is used to permanently save transaction changes.",
    "options": [
      "TRUE",
      "FALSE"
    ],
    "answer": "TRUE",
    "explanation": "COMMIT ends the transaction and makes its changes permanent."
  },
  {
    "id": 41,
    "section": "D",
    "topic": "Data types",
    "kind": "match",
    "points": 1,
    "prompt": "Match BIGINT to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "C",
    "explanation": "BIGINT: Large integer."
  },
  {
    "id": 42,
    "section": "D",
    "topic": "Data types",
    "kind": "match",
    "points": 1,
    "prompt": "Match DECIMAL to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "D",
    "explanation": "DECIMAL: Exact decimal number."
  },
  {
    "id": 43,
    "section": "D",
    "topic": "Data types",
    "kind": "match",
    "points": 1,
    "prompt": "Match JSON to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "F",
    "explanation": "JSON: JSON document."
  },
  {
    "id": 44,
    "section": "D",
    "topic": "Data types",
    "kind": "match",
    "points": 1,
    "prompt": "Match VARCHAR to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "E",
    "explanation": "VARCHAR: Variable-length text."
  },
  {
    "id": 45,
    "section": "D",
    "topic": "Keys",
    "kind": "match",
    "points": 1,
    "prompt": "Match PRIMARY KEY to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "I",
    "explanation": "PRIMARY KEY: Uniquely identify a row."
  },
  {
    "id": 46,
    "section": "D",
    "topic": "Keys",
    "kind": "match",
    "points": 1,
    "prompt": "Match FOREIGN KEY to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "G",
    "explanation": "FOREIGN KEY: Reference another table."
  },
  {
    "id": 47,
    "section": "D",
    "topic": "Constraints",
    "kind": "match",
    "points": 1,
    "prompt": "Match NOT NULL to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "A",
    "explanation": "NOT NULL: Prevent NULL."
  },
  {
    "id": 48,
    "section": "D",
    "topic": "Commands",
    "kind": "match",
    "points": 1,
    "prompt": "Match ALTER to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "H",
    "explanation": "ALTER: Modify structure."
  },
  {
    "id": 49,
    "section": "D",
    "topic": "Commands",
    "kind": "match",
    "points": 1,
    "prompt": "Match DROP to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "B",
    "explanation": "DROP: Remove table definition."
  },
  {
    "id": 50,
    "section": "D",
    "topic": "Commands",
    "kind": "match",
    "points": 1,
    "prompt": "Match ROLLBACK to its meaning.",
    "options": [
      "Prevent NULL",
      "Remove table definition",
      "Large integer",
      "Exact decimal number",
      "Variable-length text",
      "JSON document",
      "Reference another table",
      "Modify structure",
      "Uniquely identify a row",
      "Undo transaction changes"
    ],
    "answer": "J",
    "explanation": "ROLLBACK: Undo transaction changes. This applies to rollbackable changes in an active transaction."
  },
  {
    "id": 51,
    "section": "E",
    "topic": "Data types",
    "kind": "written",
    "points": 4,
    "prompt": "The application needs to calculate price × quantity. What is the design problem, and what data type would you choose for price?",
    "answer": "Price is stored as text, allowing invalid values and requiring implicit conversions for arithmetic. Choose price DECIMAL(10,2) for exact monetary values, with a precision sized to the business range.",
    "explanation": "Price is stored as text, allowing invalid values and requiring implicit conversions for arithmetic. Choose price DECIMAL(10,2) for exact monetary values, with a precision sized to the business range.",
    "code": "CREATE TABLE products (\n    product_id INT,\n    price VARCHAR(20)\n);",
    "rubric": [
      "1: Identify that price is stored as text.",
      "1: Explain validation or numeric-conversion problems.",
      "1: Choose DECIMAL with a reasonable precision and scale.",
      "1: Explain why exact decimal arithmetic suits money."
    ]
  },
  {
    "id": 52,
    "section": "E",
    "topic": "Constraints",
    "kind": "written",
    "points": 4,
    "prompt": "Every customer must have an email, and two customers cannot share the same email. What is missing? Explain both requirements.",
    "answer": "Define email VARCHAR(150) NOT NULL UNIQUE. NOT NULL makes email mandatory; UNIQUE prevents duplicates according to the column's collation. NOT NULL alone does not reject an empty string, so validate that separately if required.",
    "explanation": "Define email VARCHAR(150) NOT NULL UNIQUE. NOT NULL makes email mandatory; UNIQUE prevents duplicates according to the column's collation. NOT NULL alone does not reject an empty string, so validate that separately if required.",
    "code": "CREATE TABLE customers (\n    customer_id INT PRIMARY KEY,\n    email VARCHAR(150)\n);",
    "rubric": [
      "1: Add NOT NULL.",
      "1: Explain mandatory non-NULL values.",
      "1: Add UNIQUE.",
      "1: Explain prevention of duplicate values."
    ]
  },
  {
    "id": 53,
    "section": "E",
    "topic": "Keys",
    "kind": "written",
    "points": 4,
    "prompt": "The customers table already has customer_id as its primary key. What would you add to maintain the relationship?",
    "answer": "ALTER TABLE orders\nADD CONSTRAINT fk_orders_customer\nFOREIGN KEY (customer_id) REFERENCES customers(customer_id);\n\nThe foreign key maintains referential integrity. Use compatible types, an engine that supports foreign keys, and valid existing data. Add NOT NULL if every order must have a customer.",
    "explanation": "ALTER TABLE orders\nADD CONSTRAINT fk_orders_customer\nFOREIGN KEY (customer_id) REFERENCES customers(customer_id);\n\nThe foreign key maintains referential integrity. Use compatible types, an engine that supports foreign keys, and valid existing data. Add NOT NULL if every order must have a customer.",
    "code": "CREATE TABLE orders (\n    order_id INT PRIMARY KEY,\n    customer_id INT\n);",
    "rubric": [
      "1: Identify a FOREIGN KEY constraint.",
      "1: Use orders.customer_id as the child column.",
      "1: Reference customers(customer_id).",
      "1: Explain referential integrity."
    ]
  },
  {
    "id": 54,
    "section": "E",
    "topic": "Commands",
    "kind": "written",
    "points": 4,
    "prompt": "The developer intended to remove only today's orders. What went wrong, and what command better matches that requirement? Assume created_at is a DATETIME in the intended business time zone.",
    "answer": "DROP TABLE removes the whole table and its data. Use a filtered DELETE:\n\nDELETE FROM orders\nWHERE created_at >= CURDATE()\n  AND created_at < CURDATE() + INTERVAL 1 DAY;\n\nThe range selects only today's records. TRUNCATE is also unsuitable because it removes every row. Check the database session's business time zone. A correct DATE(created_at) = CURDATE() predicate is also acceptable.",
    "explanation": "DROP TABLE removes the whole table and its data. Use a filtered DELETE:\n\nDELETE FROM orders\nWHERE created_at >= CURDATE()\n  AND created_at < CURDATE() + INTERVAL 1 DAY;\n\nThe range selects only today's records. TRUNCATE is also unsuitable because it removes every row. Check the database session's business time zone. A correct DATE(created_at) = CURDATE() predicate is also acceptable.",
    "code": "DROP TABLE orders;",
    "rubric": [
      "1: Explain that DROP removes the entire table.",
      "1: Choose DELETE FROM orders.",
      "1: Restrict deletion to today's date with a valid predicate.",
      "1: Explain why unfiltered DELETE or TRUNCATE would remove too many rows."
    ]
  },
  {
    "id": 55,
    "section": "E",
    "topic": "Data types",
    "kind": "written",
    "points": 4,
    "prompt": "Why is this a poor choice for phone numbers? Give a better type and explain your reasoning.",
    "answer": "Phone numbers are identifiers, not quantities. INT has a limited range and cannot preserve leading zeros or a plus sign. Use VARCHAR(20), store a consistent international format, and validate the accepted characters and length.",
    "explanation": "Phone numbers are identifiers, not quantities. INT has a limited range and cannot preserve leading zeros or a plus sign. Use VARCHAR(20), store a consistent international format, and validate the accepted characters and length.",
    "code": "mobile_number INT",
    "rubric": [
      "1: Recognise phone numbers as identifiers.",
      "1: Mention leading zeros, '+' or country-code formatting.",
      "1: Choose VARCHAR with a reasonable length.",
      "1: Explain preservation and validation, or INT range limits."
    ]
  },
  {
    "id": 56,
    "section": "F",
    "topic": "Commands",
    "kind": "written",
    "points": 3,
    "prompt": "A company wants to create a new delivery_partners table. Write a suitable command with an ID and name column.",
    "answer": "CREATE TABLE delivery_partners (\n    partner_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,\n    partner_name VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE creates a new table definition.",
    "explanation": "CREATE TABLE delivery_partners (\n    partner_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,\n    partner_name VARCHAR(100) NOT NULL\n);\n\nCREATE TABLE creates a new table definition.",
    "rubric": [
      "1: Choose CREATE TABLE.",
      "1: Name delivery_partners and define valid columns.",
      "1: Explain that this creates a new table."
    ]
  },
  {
    "id": 57,
    "section": "F",
    "topic": "Commands",
    "kind": "written",
    "points": 3,
    "prompt": "Add a delivery_address column, supporting up to 255 characters, to the existing orders table. Write the command.",
    "answer": "ALTER TABLE orders\nADD COLUMN delivery_address VARCHAR(255);\n\nALTER TABLE changes the schema. ADD without COLUMN is also valid.",
    "explanation": "ALTER TABLE orders\nADD COLUMN delivery_address VARCHAR(255);\n\nALTER TABLE changes the schema. ADD without COLUMN is also valid.",
    "rubric": [
      "1: Choose ALTER TABLE orders.",
      "1: Use ADD [COLUMN] delivery_address VARCHAR(255).",
      "1: Explain that this changes structure, not existing row values."
    ]
  },
  {
    "id": 58,
    "section": "F",
    "topic": "Commands",
    "kind": "written",
    "points": 3,
    "prompt": "Rename the existing table old_products to products. Write the command.",
    "answer": "RENAME TABLE old_products TO products;\n\nALTER TABLE old_products RENAME TO products is also valid. Renaming changes the name without deleting the rows.",
    "explanation": "RENAME TABLE old_products TO products;\n\nALTER TABLE old_products RENAME TO products is also valid. Renaming changes the name without deleting the rows.",
    "rubric": [
      "1: Choose RENAME TABLE or ALTER TABLE ... RENAME.",
      "1: Correctly map old_products TO products.",
      "1: Explain that the table and its rows are retained under the new name."
    ]
  },
  {
    "id": 59,
    "section": "F",
    "topic": "Commands",
    "kind": "written",
    "points": 3,
    "prompt": "Incorrect rows were inserted in an active InnoDB transaction that has not been committed. Which command undoes the transaction changes? Explain.",
    "answer": "ROLLBACK;\n\nROLLBACK undoes rollbackable changes in the active transaction. It cannot undo an earlier committed transaction or DDL that implicitly committed.",
    "explanation": "ROLLBACK;\n\nROLLBACK undoes rollbackable changes in the active transaction. It cannot undo an earlier committed transaction or DDL that implicitly committed.",
    "rubric": [
      "1: Choose ROLLBACK.",
      "1: Explain undoing uncommitted transaction changes.",
      "1: State the transaction/commit limitation."
    ]
  },
  {
    "id": 60,
    "section": "F",
    "topic": "Commands",
    "kind": "written",
    "points": 3,
    "prompt": "Management wants the table to remain but all current records removed. Which command would you consider, and why not DROP? Mention a MySQL transaction caveat.",
    "answer": "TRUNCATE TABLE table_name;\n\nTRUNCATE empties the table while retaining its definition, resets AUTO_INCREMENT, and implicitly commits; it cannot be rolled back. Foreign-key references can prevent it. DELETE FROM table_name is a valid alternative when row deletion, triggers, or rollback in an InnoDB transaction are needed. DROP removes the table itself.",
    "explanation": "TRUNCATE TABLE table_name;\n\nTRUNCATE empties the table while retaining its definition, resets AUTO_INCREMENT, and implicitly commits; it cannot be rolled back. Foreign-key references can prevent it. DELETE FROM table_name is a valid alternative when row deletion, triggers, or rollback in an InnoDB transaction are needed. DROP removes the table itself.",
    "rubric": [
      "1: Choose TRUNCATE TABLE or an unfiltered DELETE with justification.",
      "1: Explain retaining the table and why DROP is unsuitable.",
      "1: Explain TRUNCATE's implicit commit/non-rollback or transactional DELETE requirements."
    ]
  },
  {
    "id": 61,
    "section": "G",
    "topic": "Data types",
    "kind": "written",
    "points": 3,
    "prompt": "Choose a type for customer_id: a unique numeric identifier that may grow to very large values. Explain your choice.",
    "answer": "customer_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT\n\nBIGINT UNSIGNED offers a large non-negative range. PRIMARY KEY enforces uniqueness and NOT NULL. AUTO_INCREMENT is appropriate for database-generated identifiers.",
    "explanation": "customer_id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT\n\nBIGINT UNSIGNED offers a large non-negative range. PRIMARY KEY enforces uniqueness and NOT NULL. AUTO_INCREMENT is appropriate for database-generated identifiers.",
    "rubric": [
      "1: Choose BIGINT (UNSIGNED is appropriate for non-negative IDs).",
      "1: Add PRIMARY KEY or explain uniqueness with NOT NULL.",
      "1: Explain range and/or identifier generation."
    ]
  },
  {
    "id": 62,
    "section": "G",
    "topic": "Data types",
    "kind": "written",
    "points": 3,
    "prompt": "Choose a type for product_price: values such as 49.99, 199.50, and 1299.95. Explain your choice.",
    "answer": "product_price DECIMAL(10,2)\n\nDECIMAL stores exact decimal amounts with two fractional digits. Choose precision for the maximum supported price; FLOAT and DOUBLE are approximate.",
    "explanation": "product_price DECIMAL(10,2)\n\nDECIMAL stores exact decimal amounts with two fractional digits. Choose precision for the maximum supported price; FLOAT and DOUBLE are approximate.",
    "rubric": [
      "1: Choose DECIMAL with suitable precision.",
      "1: Use a scale of 2.",
      "1: Explain exact decimal storage for money."
    ]
  },
  {
    "id": 63,
    "section": "G",
    "topic": "Data types",
    "kind": "written",
    "points": 3,
    "prompt": "Choose a type for customer_name: names have different lengths. Explain your choice.",
    "answer": "customer_name VARCHAR(150) CHARACTER SET utf8mb4\n\nVARCHAR accommodates variable-length names up to an appropriate maximum. utf8mb4 supports a wide range of international characters. A different reasonable length is acceptable.",
    "explanation": "customer_name VARCHAR(150) CHARACTER SET utf8mb4\n\nVARCHAR accommodates variable-length names up to an appropriate maximum. utf8mb4 supports a wide range of international characters. A different reasonable length is acceptable.",
    "rubric": [
      "1: Choose VARCHAR with a reasonable length.",
      "1: Explain variable-length storage.",
      "1: Explain a length bound or character-set support."
    ]
  },
  {
    "id": 64,
    "section": "G",
    "topic": "Data types",
    "kind": "written",
    "points": 3,
    "prompt": "Choose a type for order_created_at: store the date and time of an order. Explain the storage/time-zone policy.",
    "answer": "order_created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n\nDATETIME stores date and time without automatic time-zone conversion; use a consistent UTC application policy. TIMESTAMP is also acceptable when its automatic session-time-zone conversion and supported range suit the application.",
    "explanation": "order_created_at DATETIME DEFAULT CURRENT_TIMESTAMP\n\nDATETIME stores date and time without automatic time-zone conversion; use a consistent UTC application policy. TIMESTAMP is also acceptable when its automatic session-time-zone conversion and supported range suit the application.",
    "rubric": [
      "1: Choose DATETIME or TIMESTAMP.",
      "1: Explain storing both date and time.",
      "1: State a sensible time-zone/default-value policy or DATETIME/TIMESTAMP tradeoff."
    ]
  },
  {
    "id": 65,
    "section": "G",
    "topic": "Data types",
    "kind": "written",
    "points": 3,
    "prompt": "Choose a type or type family for delivery_location: geographic coordinates and location information. Which MySQL family would you investigate and why?",
    "answer": "Investigate MySQL spatial types, especially POINT with an appropriate spatial reference system such as SRID 4326 for geographic coordinates. Spatial functions/indexes can support location queries. Carefully handle coordinate order. Separate numeric latitude/longitude columns can be valid for a simple design, but the requested family is spatial/geometry.",
    "explanation": "Investigate MySQL spatial types, especially POINT with an appropriate spatial reference system such as SRID 4326 for geographic coordinates. Spatial functions/indexes can support location queries. Carefully handle coordinate order. Separate numeric latitude/longitude columns can be valid for a simple design, but the requested family is spatial/geometry.",
    "rubric": [
      "1: Identify the spatial/geometry type family.",
      "1: Choose POINT for a single location, with an appropriate SRID.",
      "1: Explain geographic queries, spatial indexing, or coordinate-system care."
    ]
  }
];
