const mongoose = require('mongoose');
require('dotenv').config();

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB já está conectado');
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout de 5 segundos
      socketTimeoutMS: 45000, // Timeout de socket de 45 segundos
    });

    isConnected = true;
    console.log(`MongoDB conectado: ${conn.connection.host}`);
    
    // Event listeners para conexão
    mongoose.connection.on('error', (err) => {
      console.error('Erro na conexão MongoDB:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB desconectado');
      isConnected = false;
    });

    // Graceful shutdown apenas em ambiente não-serverless
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        console.log('Conexão MongoDB fechada devido ao encerramento da aplicação');
        process.exit(0);
      });
    }

  } catch (error) {
    console.error('Erro ao conectar com MongoDB:', error);
    isConnected = false;
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;