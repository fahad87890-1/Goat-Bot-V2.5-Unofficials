const fs = require('fs');
const path = require('path');

class Collection {
  constructor(name) {
    this.name = name;
    this.path = path.join(__dirname, '..', 'database','data', `${name}.json`);
    this._initFile();
  }

  _initFile() {
    const dir = path.dirname(this.path);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.path)) fs.writeFileSync(this.path, '[]', 'utf-8');
  }

  _read() {
    try {
      return JSON.parse(fs.readFileSync(this.path, 'utf-8'));
    } catch (err) {
      console.error(`Error reading DB ${this.name}:`, err);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.path, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing DB ${this.name}:`, err);
    }
  }

  find(query = {}) {
    const data = this._read();
    return data.filter(doc =>
      Object.entries(query).every(([key, value]) =>
        JSON.stringify(doc[key]) === JSON.stringify(value)
      )
    );
  }

  findOne(query = {}) {
    return this.find(query)[0];
  }

  addOne(doc) {
    const data = this._read();
    const index = data.findIndex(item => item._id === doc._id);
    const now = new Date().toISOString();

    if (index !== -1) {
      const old = data[index];
      data[index] = {
        ...old,
        data: { ...old.data, ...(doc.data || {}) },
        timestamp: doc.timestamp || now
      };
    } else {
      data.push({
        _id: doc._id,
        data: doc.data || {},
        timestamp: doc.timestamp || now
      });
    }

    this._write(data);
    return data[index] || data[data.length - 1];
  }

  updateOneUsingId(id, update = {}) {
    const data = this._read();
    const index = data.findIndex(doc => doc._id === id);
    if (index !== -1) {
      data[index] = {
        ...data[index],
        ...update,
        data: {
          ...data[index].data,
          ...(update.data || {})
        },
        timestamp: update.timestamp || new Date().toISOString()
      };
      this._write(data);
      return data[index];
    }
    return null;
  }

  deleteOneUsingId(id) {
    const data = this._read();
    const filtered = data.filter(doc => doc._id !== id);
    this._write(filtered);
    return true;
  }

  deleteMany(query = {}) {
    const filtered = this._read().filter(doc =>
      !Object.entries(query).every(([key, val]) => doc[key] === val)
    );
    this._write(filtered);
    return true;
  }

  getByThreadUser(threadID, userID) {
    const key = `${threadID}::${userID}`;
    return this.findOne({ _id: key })?.data || {};
  }

  entries() {
    return this._read().map(doc => [doc._id, doc.data]);
  }
}

class Database {
  createCollection(name) {
    return new Collection(name);
  }
}

module.exports = {
  database: new Database()
};
