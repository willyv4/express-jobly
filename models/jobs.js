"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for companies. */

class Jobs {
  /**
   * Create a new job.
   *
   * @param {Object} jobData - The data for the new job.
   * @param {string} jobData.title - The title of the job.
   * @param {number} jobData.salary - The salary of the job.
   * @param {number} jobData.equity - The equity of the job.
   * @param {string} jobData.companyHandle - The handle of the company associated with the job.
   * @returns {Object} - The created job object.
   */

  static async create({ title, salary, equity, companyHandle }) {
    const result = await db.query(
      `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    return result.rows[0];
  }

  /**
   * Find all jobs.
   *
   * @returns {Array} - An array of job objects.
   */

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT title,
	        salary,
			equity,
			company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`
    );
    return jobsRes.rows;
  }

  /**
   * Filters jobs based on the specified criteria.
   *
   * @param {string} title - The title to filter by. If undefined, all jobs are returned.
   * @param {number} minSalary - The minimum salary to filter by. Defaults to 0 if not provided.
   * @param {string} hasEquity - Indicates whether jobs with equity should be included. Must be "true" or "false".
   * @returns {Array} - An array of job objects that match the specified criteria.
   * @throws {BadRequestError} - If hasEquity is not "true" or "false".
   */

  static async filterJobs(title, minSalary, hasEquity) {
    minSalary = minSalary || 0;
    let equityCondition = "";

    if (hasEquity === "true") {
      equityCondition = "AND equity > 0 AND equity IS NOT NULL";
    } else if (hasEquity === "false") {
      equityCondition = "";
    }

    const jobsRes = await db.query(
      `SELECT title, salary, equity, company_handle AS "companyHandle"
     FROM jobs
     WHERE salary >= $1 ${equityCondition}`,
      [minSalary]
    );

    return title === undefined
      ? jobsRes.rows
      : jobsRes.rows.filter((job) =>
          job.title.toLowerCase().includes(title.toLowerCase())
        );
  }

  /**
   * Get a job based on the company handle.
   *
   * @param {string} companyHandle - The handle of the company associated with the job to retrieve.
   * @returns {Object} - The job object.
   * @throws {NotFoundError} - If no job is found with the specified company handle.
   */

  static async get(companyHandle) {
    const jobsRes = await db.query(
      `SELECT title,
	        salary,
			equity,
			company_handle AS "companyHandle"
           FROM jobs
           WHERE company_handle = $1`,
      [companyHandle]
    );

    const jobs = jobsRes.rows[0];

    if (!jobs) throw new NotFoundError(`No jobs: ${companyHandle}`);

    return jobs;
  }

  /**
   * Update a job based on the company handle and provided data.
   *
   * @param {string} companyHandle - The handle of the company associated with the job to be updated.
   * @param {Object} data - The data to be updated. Should include properties like salary and equity.
   * @returns {Object} - The updated job object.
   * @throws {NotFoundError} - If no job is found with the specified company handle.
   */

  static async update(companyHandle, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      salary: "salary",
      equity: "equity",
    });
    const handleVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE company_handle = ${handleVarIdx} 
                      RETURNING title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, companyHandle]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${job}`);

    return job;
  }

  /**
   * Remove a job based on the company handle.
   *
   * @param {string} companyHandle - The handle of the company associated with the job to be removed.
   * @throws {NotFoundError} - If no job is found with the specified company handle.
   */

  static async remove(companyHandle) {
    const result = await db.query(
      `DELETE
           FROM jobs
           WHERE company_handle = $1
           RETURNING company_handle AS "companyHandle"`,
      [companyHandle]
    );
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job: ${companyHandle}`);
  }
}

module.exports = Jobs;
