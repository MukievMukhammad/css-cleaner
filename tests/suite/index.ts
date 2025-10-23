import * as path from 'path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
    // Создаем Mocha test runner
    const mocha = new Mocha({
        ui: 'tdd',
        color: true,
        timeout: 10000
    });

    const testsRoot = path.resolve(__dirname, '..');

    try {
        const files = await glob('**/**.test.js', { cwd: testsRoot });

        // Добавляем файлы в test suite
        files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

        // Запускаем тесты
        return new Promise((resolve, reject) => {
            mocha.run((failures) => {
                if (failures > 0) {
                    reject(new Error(`${failures} tests failed.`));
                } else {
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error(err);
        throw err;
    }
}
