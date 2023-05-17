"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  userToken,
  adminToken,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe("POST /jobs", function () {
  const newJob = {
    title: "hugger",
    salary: 2000000,
    equity: "0",
    companyHandle: "c2",
  };

  test("ok for admin", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(201);
    expect(resp.body).toEqual({
      job: newJob,
    });
  });

  test("unauthorized for users", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send(newJob)
      .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(401);
    expect(resp.body).toHaveProperty("error", {
      message: "Unauthorized",
      status: 401,
    });
  });

  test("unauthorized for anon users", async function () {
    const resp = await request(app).post("/jobs").send(newJob);
    expect(resp.statusCode).toEqual(500);
    expect(resp.body).toHaveProperty("error", {
      message: "Cannot read properties of undefined (reading 'isAdmin')",
      status: 500,
    });
  });

  test("bad request with missing data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "Secretary/administrator 2.0",
        salary: 182000,
        equity: "0.099",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });

  test("bad request with invalid data", async function () {
    const resp = await request(app)
      .post("/jobs")
      .send({
        title: "Secretary/administrator 2.0",
        salary: 182000,
        equity: 0.099,
        companyHandle: "jackson-sons",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** GET /jobs */

describe("GET /jobs", function () {
  test("ok for anon", async function () {
    const resp = await request(app).get("/jobs");
    expect(resp.body).toEqual({
      jobs: [
        {
          title: "job1",
          salary: 100001,
          equity: "0",
          companyHandle: "c1",
        },
        {
          title: "job2",
          salary: 100002,
          equity: "0.020",
          companyHandle: "c2",
        },
        {
          title: "job3",
          salary: 100003,
          equity: "0.030",
          companyHandle: "c3",
        },
      ],
    });
  });

  describe("GET /jobs w/filters", function () {
    test("filters by min salary and hasEquity", async function () {
      const resp = await request(app).get(
        "/jobs?minSalary=100003&hasEquity=true"
      );
      expect(resp.body).toEqual({
        jobs: [
          {
            title: "job3",
            salary: 100003,
            equity: "0.030",
            companyHandle: "c3",
          },
        ],
      });
    });
    test("filters by title", async function () {
      const resp = await request(app).get("/jobs?title=2");

      expect(resp.body).toEqual({
        jobs: [
          {
            title: "job2",
            salary: 100002,
            equity: "0.020",
            companyHandle: "c2",
          },
        ],
      });
    });
  });

  test("fails: test next() handler", async function () {
    // there's no normal failure event which will cause this route to fail ---
    // thus making it hard to test that the error-handler works with it. This
    // should cause an error, all right :)
    await db.query("DROP TABLE jobs CASCADE");
    const resp = await request(app)
      .get("/jobs")
      .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(500);
  });
});

/************************************** GET /jobs/:handle */

describe("GET /jobs/:companyHandle", function () {
  test("works for anon", async function () {
    const resp = await request(app).get(`/jobs/c1`);
    expect(resp.body).toEqual({
      jobs: {
        title: "job1",
        salary: 100001,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("not found for no such company", async function () {
    const resp = await request(app).get(`/jobs/nope`);
    expect(resp.statusCode).toEqual(404);
  });
});

/************************************** PATCH /jobs/:handle */

describe("PATCH /jobs/:companyHandle", function () {
  test("works for admin", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        salary: 101001,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({
      jobs: {
        title: "job1",
        salary: 101001,
        equity: "0",
        companyHandle: "c1",
      },
    });
  });

  test("unauth for user", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        name: "C1-new",
      })
      .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for user", async function () {
    const resp = await request(app).patch(`/jobs/c1`).send({
      name: "C1-new",
    });
    expect(resp.statusCode).toEqual(500);
  });

  test("not found on no such company", async function () {
    const resp = await request(app)
      .patch(`/jobs/nope`)
      .send({
        title: "new nope",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });

  test("bad request on handle change attempt", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        companyHandle: "c1-new",
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(500);
  });

  test("bad request on invalid data", async function () {
    const resp = await request(app)
      .patch(`/jobs/c1`)
      .send({
        equity: 0.1,
      })
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(400);
  });
});

/************************************** DELETE /jobs/:handle */

describe("DELETE /jobs/:handle", function () {
  test("works for users", async function () {
    const resp = await request(app)
      .delete(`/jobs/c1`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.body).toEqual({ deleted: "c1" });
  });

  test("unauth for user", async function () {
    const resp = await request(app)
      .delete(`/jobs/c1`)
      .set("authorization", `Bearer ${userToken}`);
    expect(resp.statusCode).toEqual(401);
  });

  test("unauth for anon", async function () {
    const resp = await request(app).delete(`/jobs/c1`);
    expect(resp.statusCode).toEqual(500);
  });

  test("not found for no such company", async function () {
    const resp = await request(app)
      .delete(`/jobs/nope`)
      .set("authorization", `Bearer ${adminToken}`);
    expect(resp.statusCode).toEqual(404);
  });
});
