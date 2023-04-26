const mysql = require("mysql");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 3000;

const connection = mysql.createConnection({
  host: "localhost", // replace with your host name or IP address
  user: "root", // replace with your MySQL username
  password: "root", // replace with your MySQL password
  database: "todo", // replace with the name of your MySQL database
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
  } else {
    console.log("Connected to MySQL database!");
  }
});

const app = express();
app.use(express.json());
app.use(cors({origin:'http://localhost:8100'}));


app.post('/signup', (req, res) => {

    const {name, email,password} = req.body;
  
    // Use a raw SQL query to insert a new row in the "users" table
    connection.query(`INSERT INTO users (name, email, password) VALUES ('${name}', '${email}','${password}')`, (err, result) => {
      if (err) {
        console.error('Error inserting new user:', err);
        res.status(500).send('Error inserting new user');
      } else {
        console.log('New user inserted:', result);
        res.status(201).send('New user inserted');
      }
    });
  })

  app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    // Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
  
    // Execute raw MySQL query to retrieve user by email and password
    const query = `SELECT * FROM users WHERE email = '${email}' AND password = '${password}'`;
    connection.query(query, (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      // Check if user was found
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Generate JWT token
      const user = results[0];
      const token = jwt.sign({ id: user.id, email: user.email }, 'mysecretkey', { expiresIn: '1h' });
  
      // Return JWT token to client
      res.json({ token, id:user.id });
    });
  });

  app.get('/todos/:id', (req, res) => {
    const { id } = req.params;
    const sql = `SELECT * FROM todolist WHERE user_id = ${id}`;
    connection.query(sql, (err,result)=>{
        if(err) throw err;
        else{
            res.send(result);
        }
    });
  });

  app.put('/updateTodo', (req,res)=>{
    const {id, user_id} = req.query;
    const {title, details} = req.body;
    const sql = `UPDATE todolist SET title=?, details=? WHERE id=? AND user_id=?`;
    const values = [title, details, id, user_id];  
    connection.query(sql, values, (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          console.log(result);
          res.status(200).send('Todo updated successfully');
        }
      });
  })

  app.post('/addTodos', (req, res) => {
    const {todo} = req.body;
    const { title,details,isCompleted, user_id } = todo;
    const sql = 'INSERT INTO todolist (title,details,isCompleted, user_id) VALUES (?,?,?,?)';
    const values = [title,details, isCompleted, user_id];
    connection.query(sql, values, (err, result) => {
      if (err) throw err;
      res.send(`Task added with ID: ${result.insertId}`);
    });
  });

  app.delete('/deleteTodo/:id', (req, res) => {
    const id = req.params.id;
    const sql = 'DELETE FROM todolist WHERE id = ?';
    connection.query(sql, [id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
      } else {
        console.log(result);
        res.status(200).send('Todo deleted successfully');
      }
    });
  });
  

  app.listen(3000, () => {
    console.log('Server listening on port: '+port);
  });
