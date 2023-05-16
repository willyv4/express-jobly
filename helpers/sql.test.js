const { BadRequestError } = require("../expressError");
const { sqlForPartialUpdate } = require("./sql");

describe("sqlForPartialUpdate", function () {
  let dataToUpdate;
  let jsToSql;

  beforeEach(() => {
    dataToUpdate = {
      firstName: "Aliya",
      age: 32,
    };

    jsToSql = {
      firstName: "first_name",
    };
  });

  afterEach(() => {
    dataToUpdate = null;
    jsToSql = null;
  });
  test("should turn JS object into an array of keys and sql vals", () => {
    const result = sqlForPartialUpdate(dataToUpdate, jsToSql);

    expect(result.setCols).toEqual('"first_name"=$1, "age"=$2');
    expect(result.values).toEqual(["Aliya", 32]);
  });

  test("should throw error if length is 0", () => {
    dataToUpdate = {};

    try {
      sqlForPartialUpdate(dataToUpdate, jsToSql);
      fail("Expected BadRequestError to be thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(BadRequestError);
      expect(err.message).toBe("No data");
    }
  });
});
