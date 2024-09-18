const express = require("express");
const morgan = require("morgan");
const compression = require("compression");
const helmet = require("helmet");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const app = express();
const port = 3000;

// Built-in middleware for parsing JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions = {
  origin: ["http://example.com", "http://another-example.com"], // Allow these origins
  methods: ["GET", "POST", "PUT", "DELETE"], // Allowed HTTP methods
  allowedHeaders: [
    "Content-Type", // Standard header for content type
    "Authorization", // For authorization tokens
  ],
  credentials: true, // Allow credentials (cookies, authorization headers)
};

app.use(cors(corsOptions)); // Enable CORS with the specified options

// Third-party middleware
app.use(morgan("tiny")); // Logging requests
app.use(compression()); // Compressing responses
app.use(helmet()); // Setting security-related HTTP headers

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use(limiter); // Apply rate limiting to all requests

// Custom middleware for logging request details
const logger = (req, res, next) => {
  const { method, url } = req;
  const time = new Date().toISOString();
  console.log(`[${time}] ${method} request for '${url}'`);
  next();
};

app.use(logger);

// Simulated in-memory database for users
let users = [];

// Router-level middleware
const router = express.Router();

// Authentication middleware
const authenticate = (req, res, next) => {
  const token = req.headers["authorization"];
  if (token) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Protected route
router.get("/protected", authenticate, (req, res) => {
  res.json({ message: "This is a protected route" });
});

// Create a new user
router.post("/users", (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).json({ error: "Name and age are required." });
  }
  const newUser = { id: users.length + 1, name, age };
  users.push(newUser);
  res.status(201).json({ message: "User created", user: newUser });
});

// Read all users
router.get("/users", (req, res) => {
  res.json(users);
});

// Read a single user by ID
router.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// Update a user by ID
router.put("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  const { name, age } = req.body;
  if (name) user.name = name;
  if (age) user.age = age;
  res.json({ message: "User updated", user });
});

// Delete a user by ID
router.delete("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  users = users.filter((u) => u.id !== userId);
  res.json({ message: "User deleted" });
});

app.use("/api", router);

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
