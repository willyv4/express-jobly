"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Jobs = require("./jobs.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

describe("create", function () {
  const newJob = {
    title: "hugger",
    salary: 2000000,
    equity: "0",
    companyHandle: "c2",
  };

  test("works", async function () {
    let job = await Jobs.create(newJob);
    expect(job).toEqual(newJob);

    const result = await db.query(
      `SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE company_handle = 'c2' AND title = 'hugger'`
    );
    expect(result.rows).toEqual([
      {
        title: "hugger",
        salary: 2000000,
        equity: "0",
        company_handle: "c2",
      },
    ]);
  });
});

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Jobs.findAll();
    expect(jobs).toEqual([
      {
        title: "job1",
        salary: 10000,
        equity: "0.1",
        companyHandle: "c1",
      },
      {
        title: "job2",
        salary: 20000,
        equity: "0.2",
        companyHandle: "c2",
      },
      {
        title: "job3",
        salary: 30000,
        equity: "0.3",
        companyHandle: "c3",
      },
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let jobs = await Jobs.get("c1");
    let job = jobs[0];
    expect(job).toEqual({
      title: "job1",
      salary: 10000,
      equity: "0.1",
      companyHandle: "c1",
    });
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.get("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "hugger extreme",
    salary: 20000000,
    equity: "0.2",
  };

  test("works", async function () {
    let job = await Jobs.update("c2", updateData);
    expect(job).toEqual({
      companyHandle: "c2",
      ...updateData,
    });

    const result = await db.query(
      `SELECT title, salary, equity
           FROM jobs
           WHERE company_handle = 'c2'`
    );

    expect(result.rows).toEqual([
      {
        title: "hugger extreme",
        salary: 20000000,
        equity: "0.2",
      },
    ]);
  });

  test("works: null fields", async function () {
    const updateDataNulls = {
      title: "hugger extreme",
      salary: null,
      equity: null,
    };

    let job = await Jobs.update("c2", updateDataNulls);
    expect(job).toEqual({
      companyHandle: "c2",
      ...updateDataNulls,
    });

    const result = await db.query(
      `SELECT title, salary, equity
           FROM jobs
           WHERE company_handle = 'c2'`
    );

    expect(result.rows).toEqual([
      {
        title: "hugger extreme",
        salary: null,
        equity: null,
      },
    ]);
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.update("nope", updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Jobs.update("c1", {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Jobs.remove("c1");
    const res = await db.query(
      "SELECT company_handle FROM jobs WHERE company_handle='c1'"
    );
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such job", async function () {
    try {
      await Jobs.remove("nope");
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
