const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
    try {
        const OLD_DB_PATH = path.resolve(__dirname, '../../heladeria-ventas-control/heladeria.db');
        if (!fs.existsSync(OLD_DB_PATH)) { app.quit(); return; }

        const db = new Database(OLD_DB_PATH, { readonly: true });

        const tables = ["promotions", "settings"];
        for (const t of tables) {
            console.log(`\nDATA [${t}]:`);
            const rows = db.prepare(`SELECT * FROM ${t} LIMIT 5`).all();
            console.log(JSON.stringify(rows, null, 2));
        }

        db.close();
    } catch (e) {
        console.error(e);
    }
    app.quit();
});
