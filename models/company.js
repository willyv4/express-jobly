"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Company {
  /** Create a company (from data), update db, return new company data.
   *
   * data should be { handle, name, description, numEmployees, logoUrl }
   *
   * Returns { handle, name, description, numEmployees, logoUrl }
   *
   * Throws BadRequestError if company already in database.
   * */

  static async create({ handle, name, description, numEmployees, logoUrl }) {
    const duplicateCheck = await db.query(
      `SELECT handle
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    if (duplicateCheck.rows[0])
      throw new BadRequestError(`Duplicate company: ${handle}`);

    const result = await db.query(
      `INSERT INTO companies
           (handle, name, description, num_employees, logo_url)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING handle, name, description, num_employees AS "numEmployees", logo_url AS "logoUrl"`,
      [handle, name, description, numEmployees, logoUrl]
    );
    const company = result.rows[0];

    return company;
  }

  /** Find all companies.
   *
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   * */

  static async findAll() {
    const companiesRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           ORDER BY name`
    );
    return companiesRes.rows;
  }

  /**
   * Filter Companies by name, minEmployees, and maxEmployees.
   *
   * This function filters companies based on the specified parameters.
   * It can be used with all or as little as one parameter.
   *
   * @example
   *    INPUT: /companies?name=inc&minEmployees=200&maxEmployees=300
   *    OUTPUT: Returns all companies with "inc" in their name,
   *         with minimum employees above 200 and maximum employees below 300.
   *
   *
   * Inputs can also filter with just name, just minEmployees, or just maxEmployees.
   *
   * @param {string} name - The name string to filter the companies by (optional).
   * @param {number} minEmployees - The minimum number of employees to filter the companies by (optional, default: 0).
   * @param {number} maxEmployees - The maximum number of employees to filter the companies by (optional, default: 5000000).
   * @returns {Array} An array of company objects matching the filtered criteria.
   */

  static async filterCompanies(name, minEmployees, maxEmployees) {
    minEmployees = minEmployees || 0;
    maxEmployees = maxEmployees || 5000000;

    const companiesRes = await db.query(
      `SELECT handle,
            name,
            description,
            num_employees AS "numEmployees",
            logo_url AS "logoUrl"
     FROM companies
     WHERE num_employees >= $1 AND num_employees <= $2`,
      [minEmployees, maxEmployees]
    );

    if (name === undefined) {
      return companiesRes.rows;
    } else {
      return companiesRes.rows.filter((company) =>
        company.name.toLowerCase().includes(name.toLowerCase())
      );
    }
  }

  /** Given a company handle, return data about company.
   *
   * Returns { handle, name, description, numEmployees, logoUrl, jobs }
   *   where jobs is [{ id, title, salary, equity, companyHandle }, ...]
   *
   * Throws NotFoundError if not found.
   **/

  static async get(handle) {
    const companyRes = await db.query(
      `SELECT handle,
                  name,
                  description,
                  num_employees AS "numEmployees",
                  logo_url AS "logoUrl"
           FROM companies
           WHERE handle = $1`,
      [handle]
    );

    const company = companyRes.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Update company data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {name, description, numEmployees, logoUrl}
   *
   * Returns {handle, name, description, numEmployees, logoUrl}
   *
   * Throws NotFoundError if not found.
   */

  static async update(handle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      numEmployees: "num_employees",
      logoUrl: "logo_url",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE companies 
                      SET ${setCols} 
                      WHERE handle = ${handleVarIdx} 
                      RETURNING handle, 
                                name, 
                                description, 
                                num_employees AS "numEmployees", 
                                logo_url AS "logoUrl"`;
    const result = await db.query(querySql, [...values, handle]);
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);

    return company;
  }

  /** Delete given company from database; returns undefined.
   *
   * Throws NotFoundError if company not found.
   **/

  static async remove(handle) {
    const result = await db.query(
      `DELETE
           FROM companies
           WHERE handle = $1
           RETURNING handle`,
      [handle]
    );
    const company = result.rows[0];

    if (!company) throw new NotFoundError(`No company: ${handle}`);
  }
}

module.exports = Company;
