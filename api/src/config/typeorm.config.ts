import { DataSource, DataSourceOptions } from 'typeorm';
import { join } from 'path';

export const typeOrmConfig: DataSourceOptions = {
  type: 'sqlite',
  database: process.env.DATABASE_PATH || './data/game.db',
  synchronize: false, // Dùng migrations
  logging: process.env.NODE_ENV === 'development',
  entities: [join(__dirname, '..', 'entities', '*.entity{.ts,.js}')],
  migrations: [join(__dirname, '..', 'migrations', '*{.ts,.js}')],
  // SQLite PRAGMA settings cho WAL mode, foreign keys, busy timeout
  extra: {
    busyTimeout: 5000,
  },
};

// Export DataSource cho CLI migrations với PRAGMA setup
const dataSource = new DataSource(typeOrmConfig);

// Hook để set PRAGMA khi khởi tạo connection
dataSource.initialize().then(() => {
  if (dataSource.isInitialized) {
    dataSource.query('PRAGMA foreign_keys = ON');
    dataSource.query('PRAGMA journal_mode = WAL');
    dataSource.query('PRAGMA busy_timeout = 5000');
  }
}).catch(() => {
  // Sẽ được gọi lại từ app.module
});

export default dataSource;
