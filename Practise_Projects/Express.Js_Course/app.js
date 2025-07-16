const express = require('express');
const app = express();
const notesRoutes = require('./routes/notesRoutes');
const logger = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

app.use(express.json());
app.use(logger);

app.use('/api/notes', notesRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
