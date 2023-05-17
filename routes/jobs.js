"use strict";

/** Routes for companies. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Jobs = require("../models/jobs");

const jobNew = require("../schemas/jobNew.json");
const jobUpdate = require("../schemas/jobUpdate.json");

const router = new express.Router();

/**
 * Create a new job.
 * Route: POST /jobs
 * Security: Admin access required
 */

router.post("/", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobNew);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const job = await Jobs.create(req.body);
    return res.status(201).json({ job });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get a list of jobs.
 * Route: GET /jobs
 * Query Parameters:
 *   - title: (optional) Filter jobs by title
 *   - minSalary: (optional) Filter jobs by minimum salary
 *   - hasEquity: (optional) Filter jobs by equity availability (true/false)
 */

router.get("/", async function (req, res, next) {
  try {
    const { title, minSalary, hasEquity } = req.query;
    let jobs;

    title || minSalary || hasEquity
      ? (jobs = await Jobs.filterJobs(title, minSalary, hasEquity))
      : (jobs = await Jobs.findAll());

    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/**
 * Get a specific job by company handle.
 * Route: GET /jobs/:companyHandle
 * Path Parameters:
 *   - companyHandle: Company handle of the job
 */

router.get("/:companyHandle", async function (req, res, next) {
  try {
    const jobs = await Jobs.get(req.params.companyHandle);
    return res.status(200).json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/**
 * Update a job by company handle.
 * Requires admin authentication.
 * Route: PATCH /jobs/:companyHandle
 * Path Parameters:
 *   - companyHandle: Company handle of the job
 * Request Body:
 *   - JSON object representing the updated job data
 */

router.patch("/:companyHandle", ensureAdmin, async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, jobUpdate);
    if (!validator.valid) {
      const errs = validator.errors.map((e) => e.stack);
      throw new BadRequestError(errs);
    }

    const jobs = await Jobs.update(req.params.companyHandle, req.body);
    return res.json({ jobs });
  } catch (err) {
    return next(err);
  }
});

/**
 * Delete a job by company handle.
 * Requires admin authentication.
 * Route: DELETE /jobs/:companyHandle
 * Path Parameters:
 *   - companyHandle: Company handle of the job to be deleted
 */

router.delete("/:companyHandle", ensureAdmin, async function (req, res, next) {
  try {
    await Jobs.remove(req.params.companyHandle);
    return res.json({ deleted: req.params.companyHandle });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
