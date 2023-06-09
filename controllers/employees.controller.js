const connection = require('../connection');


function postEmployee(req, res) {
    const employeeData = {
      name: req.body.name,
      job_title: req.body.job_title,
      phone: req.body.phone,
      email: req.body.email,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
    };
  
    const query = "INSERT INTO employees values (null,?,?,?,?,?,?,?)";
    connection.query(
      query,
      [
        employeeData.name,
        employeeData.job_title,
        employeeData.phone,
        employeeData.email,
        employeeData.address,
        employeeData.city,
        employeeData.state,
      ],
      (err, result) => {
        if (err) {
          console.error("error creating employee: " + err.stack);
          res.status(500).json({ message: "Error creating employee" });
          return;
        }
  
        // extract contact data from form input
        const contactData = {
          employee_id: result.insertId, // get the ID of the newly inserted employee
          name: req.body.contact_name,
          contact: req.body.contact_info,
          relationship: req.body.contact_relationship,
        };
  
        // insert contact data into the 'employee_contacts' table
        connection.query(
          "INSERT INTO employee_contacts values (null,?,?,?,?)",
          [contactData.employee_id, contactData.name, contactData.contact, contactData.relationship],
          (error, results, fields) => {
            if (error) throw error;
          }
        );
        res.status(201).json({
            message: "employee created successfully",
            id: result.insertId,
          });
      }
    );
}

function getEmployees(req, res){
    const perPage = 20; // number of items per page
    const page = req.query.page || 1; // current page number
    const offset = (page - 1) * perPage; // offset for SQL query
  
    // SQL query to retrieve employees for the current page
    const query = `SELECT e.*, c.name as contact_name, c.contact as contact_info, c.relationship as contact_relationship
                   FROM employees e
                   LEFT JOIN employee_contacts c ON e.id = c.employee_id
                   ORDER BY e.id
                   LIMIT ?, ?`;
  
    // Execute the query with the offset and limit values
    connection.query(query, [offset, perPage], (err, results) => {
      if (err) {
        console.error("Error listing employees: " + err.stack);
        res.status(500).json({ message: "Error listing employees" });
        return;
      }
  
      // Count the total number of employees in the database
      const countQuery = "SELECT COUNT(*) as count FROM employees";
      connection.query(countQuery, (err, countResult) => {
        if (err) {
          console.error("Error counting employees: " + err.stack);
          res.status(500).json({ message: "Error listing employees" });
          return;
        }
  
        const count = countResult[0].count;
        const totalPages = Math.ceil(count / perPage); // Calculate the total number of pages
  
        // Send the response as a JSON object with the current page, total pages, and employee data
        res.status(200).json({
          currentPage: page,
          totalPages: totalPages,
          employees: results,
        });
      });
    });
  }

function getEmployee(req, res){
    const id = req.params.id;
    const query = "SELECT e.id, e.name, e.job_title, e.phone, e.email, e.address, e.city, e.state, ec.name as contact_name, ec.contact, ec.relationship FROM employees e left JOIN employee_contacts ec ON e.id = ec.employee_id WHERE e.id = ?";
  
    connection.query(query, [id], (err, result) => {
      if (err) {
        console.error("error getting employee:" + err.stack);
        res.status(500).json({ message: "error getting employee" });
        return;
      }
      if (result.length === 0) {
        res.status(404).json({ message: "employee not found" });
        return;
      }
  
  
      const employeeData = {
          id: result[0].id,
          name: result[0].name,
          job_title: result[0].job_title,
          phone: result[0].phone,
          email: result[0].email,
          address: result[0].address,
          city: result[0].city,
          state: result[0].state,
        };
        const contacts = result.map((row) => ({
          name: row.name,
          contact: row.contact,
          relationship: row.relationship,
        }));
    
        res.status(200).json({ employee: employeeData, contacts: contacts });
  
    });
  }

function putEmployee(req, res){
    const { name, job_title, phone, email, address, city, state } = req.body;
    const id = req.params.id;
    const query =
      "UPDATE employees SET name = ?, job_title = ?, phone = ?, email = ?, address = ?, city = ?, state = ? WHERE id = ?";
  
    connection.query(
      query,
      [name, job_title, phone, email, address, city, state, id],
      (err, result) => {
        if (err) {
          console.error("error updating employee: " + err.stack);
          res.status(500).json({ message: "error updating employee" });
          return;
        }
        if (result.affectedRows === 0) {
          res.status(404).json({ message: "employee not found" });
          return;
        }
        res.status(200).json({ message: "employee updated successfully" });
      }
    );
  }

function dltEmployee(req, res){
    const id = req.params.id;
    const deleteContactsQuery = "DELETE FROM employee_contacts WHERE employee_id = ?";
    const deleteEmployeeQuery = "DELETE FROM employees WHERE id = ?";
  
    connection.query(deleteContactsQuery, [id], (err, result) => {
      if (err) {
        console.error("error deleting employee contacts: " + err.stack);
        res.status(500).json({ message: "error deleting employee contacts" });
        return;
      }
  
      connection.query(deleteEmployeeQuery, [id], (err, result) => {
        if (err) {
          console.error("error deleting employee: " + err.stack);
          res.status(500).json({ message: "error deleting employee" });
          return;
        }
        if (result.affectedRows === 0) {
          res.status(404).json({ message: "employee not found" });
          return;
        }
  
        res.status(200).json({ message: "employee deleted successfully" });
      });
    });
  }

module.exports = {
    postEmployee,
    getEmployees,
    getEmployee,
    putEmployee,
    dltEmployee
}