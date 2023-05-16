const { BadRequestError } = require("../expressError");

/**
 * Converts a JavaScript object into SQL syntax for partial updates.
 *
 * @param {object} dataToUpdate - The JavaScript object containing the data to update.
 * @param {object} jsToSql - The mapping object that maps JavaScript keys to SQL column names.
 * @returns {object} - An object with two properties:
 *   - setCols: A string representing the SQL-friendly column names and placeholders for the update statement.
 *   - values: An array of the original values from the JavaScript object.
 * @throws {BadRequestError} - Throws an error if no data is provided in the JavaScript object.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map(
    (colName, idx) => `"${jsToSql[colName] || colName}"=$${idx + 1}`
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
