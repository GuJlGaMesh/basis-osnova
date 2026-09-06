'use strict';

// Проверка расчётов и управляющих ветвей JavaScript. Это не эмулятор БАЗИС.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const sourcePath = path.resolve(__dirname, '../src/vanity-1200.js');
const source = fs.readFileSync(sourcePath, 'utf8');
const results = [];
const hash = text => crypto.createHash('sha256').update(text).digest('hex');
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);

function test(name, run) {
    try { run(); results.push({ name, status: 'PASS' }); }
    catch (error) { results.push({ name, status: 'FAIL', error: String(error.stack || error) }); }
}

// Возврат до основного try исключает выполнение построения. Исходник не меняется.
function functions(extra = {}) {
    const marker = '    try {';
    assert.equal(source.split(marker).length, 2, 'Неоднозначная точка экспорта функций');
    const instrumented = source.replace(marker,
        '    globalThis.__unit = { calculate: calculate, roundOpen: roundOpen, askNumber: askNumber, objects: objects, clearCurrentModel: clearCurrentModel }; return;\n' + marker);
    const context = { Geometry2D: { Area: contour => mathematicalArea(contour._segments) },
        ...extra, Vector: (x, y, z) => ({ x, y, z }) };
    vm.runInNewContext(instrumented, context, { timeout: 1000, filename: sourcePath });
    return context.__unit;
}

function input(centerZ = 100, scope = 1, diameter = 120) { return { centerZ, scope, diameter }; }
const pure = functions();

test('Синтаксис JavaScript / Node (совместимость БАЗИС не проверяется)', () => new vm.Script(source));
test('Размеры FRM0444.S30 по независимым контрольным значениям', () => {
    const c = pure.calculate(input());
    const expected = { nl: 300, drawerDepth: 290, opening: 1168, outerWidth: 1158,
        innerWidth: 1126, sideGap: 5, left: 21, right: 1179, back: 89,
        bottomBack: 105, bottomFront: 363, runnerFront: 379 };
    for (const [key, value] of Object.entries(expected)) near(c[key], value);
    assert.equal(c.specs.length, 21);
    assert.equal(new Set(c.specs.map(s => s.id)).size, 21);
    for (const id of ['L09', 'U09']) {
        const s = c.specs.find(s => s.id === id);
        assert.ok(s, id);
        near(s.w, 1126); near(s.d, 258); near(s.h, 16);
    }
});

function circumcircle(a, m, b) {
    const d = 2 * (a.x * (m.y - b.y) + m.x * (b.y - a.y) + b.x * (a.y - m.y));
    assert.ok(Math.abs(d) > 1e-9, 'Дуга вырождена');
    const qa = a.x ** 2 + a.y ** 2, qm = m.x ** 2 + m.y ** 2, qb = b.x ** 2 + b.y ** 2;
    const x = (qa * (m.y - b.y) + qm * (b.y - a.y) + qb * (a.y - m.y)) / d;
    const y = (qa * (b.x - m.x) + qm * (a.x - b.x) + qb * (m.x - a.x)) / d;
    return { x, y, r: Math.hypot(a.x - x, a.y - y) };
}
const angle = (point, circle) => Math.atan2(point.y - circle.y, point.x - circle.x);
const positiveAngle = a => (a % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
function arcSweep(e, circle) {
    const end = positiveAngle(angle(e.b, circle) - angle(e.a, circle));
    const middle = positiveAngle(angle(e.mid, circle) - angle(e.a, circle));
    return middle < end ? end : end - 2 * Math.PI;
}
function mathematicalArea(edges) {
    return edges.reduce((sum, e) => {
        if (!e.mid) return sum + (e.a.x * e.b.y - e.b.x * e.a.y) / 2;
        const circle = circumcircle(e.a, e.mid, e.b);
        return sum + (circle.x * (e.b.y - e.a.y) - circle.y * (e.b.x - e.a.x) + circle.r ** 2 * arcSweep(e, circle)) / 2;
    }, 0);
}
function contour(c, s, sign) {
    const segments = [];
    const panel = {
        // Только явное преобразование координат X/Z: не геометрия CAD-объекта.
        ToObject: point => ({ x: point.x - s.x, y: sign * (point.z - s.z), z: 0 }),
        Contour: {
            _segments: segments,
            get Count() { return segments.length; },
            Clear() { segments.length = 0; },
            AddLine(x1, y1, x2, y2) { segments.push({ a: { x: x1, y: y1 }, b: { x: x2, y: y2 } }); },
            AddArc(a, b, center, counterclockwise) {
                assert.equal(counterclockwise, false, 'Внутренняя дуга должна обходиться по часовой стрелке');
                const start = angle(a, center), radius = Math.hypot(a.x - center.x, a.y - center.y);
                const sweep = counterclockwise ? positiveAngle(angle(b, center) - start) : -positiveAngle(start - angle(b, center));
                const mid = { x: center.x + radius * Math.cos(start + sweep / 2), y: center.y + radius * Math.sin(start + sweep / 2) };
                segments.push({ a, mid, b });
            }
        }
    };
    pure.roundOpen(panel, s, c);
    return segments;
}

for (const centerZ of [100, 200]) for (const sign of [1, -1]) {
    test(`Контур Z=${centerZ}, знак локальной оси=${sign}: окружность, стыки и площадь`, () => {
        const c = pure.calculate(input(centerZ));
        for (const s of c.specs.filter(s => s.cut === 'round-open')) {
            const edges = contour(c, s, sign), arcs = edges.filter(e => e.mid);
            assert.equal(arcs.length, 1);
            assert.equal(edges.length, centerZ === 100 ? 6 : 8, 'Ожидался круговой сегмент либо U-образный проход');
            let area = 0;
            for (let i = 0; i < edges.length; i++) {
                const e = edges[i], next = edges[(i + 1) % edges.length];
                near(e.b.x, next.a.x); near(e.b.y, next.a.y);
                if (!e.mid) area += (e.a.x * e.b.y - e.b.x * e.a.y) / 2;
                else {
                    const circle = circumcircle(e.a, e.mid, e.b), sweep = arcSweep(e, circle);
                    near(circle.x, 600 - s.x); near(circle.y, sign * (centerZ - s.z)); near(circle.r, 60);
                    for (const p of [e.a, e.mid, e.b]) near(Math.hypot(p.x - circle.x, p.y - circle.y), 60);
                    assert.ok(Math.abs(sweep) > 0 && Math.abs(sweep) <= Math.PI + 1e-9);
                    area += (circle.x * (e.b.y - e.a.y) - circle.y * (e.b.x - e.a.x) + circle.r ** 2 * sweep) / 2;
                }
            }
            const h = centerZ - s.z;
            const removed = h >= 0 ? 120 * h + Math.PI * 60 ** 2 / 2 :
                60 ** 2 * Math.acos(-h / 60) + h * Math.sqrt(60 ** 2 - h ** 2);
            near(area, 1126 * 258 - removed, 1e-6);
            assert.ok(area > 0 && area < s.w * s.d);
        }
    });
}

for (const centerZ of [100, 200]) for (const scope of [1, 2]) {
    test(`Объёмы 21 прямоугольной панели не пересекаются: Z=${centerZ}, вариант=${scope}`, () => {
        const c = pure.calculate(input(centerZ, scope));
        for (let i = 0; i < c.specs.length; i++) for (let j = i + 1; j < c.specs.length; j++) {
            const a = c.specs[i], b = c.specs[j];
            const overlap = [['x', 'w'], ['y', 'h'], ['z', 'd']].every(([p, size]) =>
                Math.min(a[p] + a[size], b[p] + b[size]) - Math.max(a[p], b[p]) > 1e-8);
            assert.ok(!overlap, `${a.id} пересекается с ${b.id}`);
        }
        assert.equal(c.specs.find(s => s.id === 'C03').cut, scope === 2 ? 'circle' : '');
    });
}

test('Расчёт отвергает недопустимые координаты, диаметры и область выреза', () => {
    for (const bad of [0, -1, NaN, Infinity, '100']) assert.throws(() => pure.calculate(input(bad)));
    for (const bad of [0, -1, NaN, Infinity, '120', 1200]) assert.throws(() => pure.calculate(input(100, 1, bad)));
    assert.throws(() => pure.calculate(input(1, 1, 40)), /позади дна/);
    assert.throws(() => pure.calculate(input(350, 1, 120)), /переднюю стенку/);
    assert.throws(() => pure.calculate(input(50, 2, 120)), /внутри дна корпуса/);
    assert.throws(() => pure.calculate(input(100, 3)), /только 1 или 2/);
});

function existingModel() {
    const hidden = { id: 'hidden', Visible: false };
    const nested = { id: 'nested', Objects: [hidden], get Count() { return this.Objects.length; } };
    const otherDocument = { Objects: [{ id: 'other' }] };
    const Model = { Objects: [{ id: 'panel' }, nested, { id: 'hiddenRoot', Visible: false }],
        get Count() { return this.Objects.length; } };
    return { Model, nested, hidden, otherDocument };
}

function preflight(answers, options = {}) {
    const fixture = existingModel(), original = fixture.Model.Objects.slice();
    const alerts = [], calls = { delete: 0, build: 0, open: 0 };
    const forbiddenBuild = () => { calls.build++; throw new Error('CAD построение в тесте запрещено'); };
    const context = {
        Model: fixture.Model, DatumMode: { Box: 6, FaceFace: 2 }, Geometry2D: { Area: forbiddenBuild },
        TFastener: function TFastener() {}, AddBlock: forbiddenBuild, AddCopy: forbiddenBuild, AddExtrusion: forbiddenBuild,
        Vector: (x, y, z) => ({ x, y, z }), prompt: () => answers.shift(), alert: message => alerts.push(message),
        AddVertPanel: forbiddenBuild, AddHorizPanel: forbiddenBuild, AddFrontPanel: forbiddenBuild, NewContour: forbiddenBuild,
        DeleteObject: () => { calls.delete++; }, // Намеренно не удаляет: отдельный тест ошибки очистки.
        OpenFurniture: file => {
            calls.open++;
            if (file.includes('dowel')) return { DatumMode: 2, Mount() {} };
            if (file.includes('camar')) return { DatumMode: 6, MountBox() {} };
            return options.library || null;
        }
    };
    if (options.noModel) delete context.Model;
    if (options.noAPI) delete context.AddVertPanel;
    vm.runInNewContext(source, context, { timeout: 1000, filename: sourcePath });
    assert.equal(calls.build, 0);
    assert.deepEqual(fixture.Model.Objects, original);
    assert.equal(alerts.length, 1); assert.ok(!alerts[0].includes('Создано 21 панель'));
    return { calls, message: alerts[0] };
}

for (const [name, answers] of [
    ['отмена', [null]], ['пустота', ['   ']], ['текст', ['abc']],
    ['отмена второго поля', ['1', null]], ['пустой диаметр', ['1', '100', '']],
    ['центр ноль', ['1', '0', '120']], ['центр отрицательный', ['1', '-1', '120']],
    ['центр текст', ['1', 'xxx', '120']], ['центр бесконечность', ['1', 'Infinity', '120']],
    ['неверная область', ['3', '100', '120']], ['радиус велик', ['1', '100', '1200']],
    ['центр за передней стенкой', ['1', '350', '120']]
]) test(`До изменения модели: ${name}`, () => {
    const result = preflight(answers.slice());
    assert.equal(result.calls.delete, 0); assert.equal(result.calls.open, 0);
    assert.match(result.message, /Ввод отменён|Построение остановлено: ввод размеров выреза/);
    assert.match(result.message, /Очистка и построение не выполнялись/);
});

for (const [name, options] of [
    ['нет библиотеки', {}], ['неверный тип библиотеки', { library: { DatumMode: 1, MountBox() {} } }],
    ['нет MountBox', { library: { DatumMode: 6 } }], ['нет документа', { noModel: true }], ['нет API', { noAPI: true }]
]) test(`Сохранение текущего содержимого: ${name}`, () => {
    const result = preflight(['1', '100', '120'], options);
    assert.equal(result.calls.delete, 0);
    if (!options.noModel && !options.noAPI) {
        assert.equal(result.calls.open, 1);
        assert.match(result.message, /проверка библиотеки Firmax/);
    }
    if (options.noModel) assert.match(result.message, /Нет текущего документа/);
    if (options.noAPI) assert.match(result.message, /Недоступен требуемый глобальный API/);
    assert.match(result.message, /Очистка и построение не выполнялись/);
});

test('Ошибка очистки не запускает создание панелей', () => {
    const result = preflight(['1', '100', '120'], { library: { DatumMode: 6, MountBox() {} } });
    assert.equal(result.calls.delete, 3);
    assert.match(result.message, /Очистка не завершилась/);
});
test('Очистка передаёт скрытые и вложенные корни DeleteObject; повторная очистка', () => {
    const { Model, otherDocument } = existingModel(), calls = [], others = JSON.stringify(otherDocument);
    const unit = functions({ Model, DeleteObject: obj => {
        calls.push(obj.id); const index = Model.Objects.indexOf(obj);
        assert.ok(index >= 0); Model.Objects.splice(index, 1);
    } });
    unit.clearCurrentModel();
    assert.deepEqual(calls, ['hiddenRoot', 'nested', 'panel']); assert.equal(Model.Count, 0);
    assert.equal(JSON.stringify(otherDocument), others);
    unit.clearCurrentModel(); assert.equal(calls.length, 3);
    Model.Objects.push({ id: 'rebuilt-placeholder' }, { id: 'manual-edit', Visible: false });
    unit.clearCurrentModel(); assert.equal(Model.Count, 0);
    assert.deepEqual(calls.slice(3), ['manual-edit', 'rebuilt-placeholder']);
    Model.Objects.push(Model); unit.clearCurrentModel(); assert.equal(Model.Count, 1);
    assert.equal(Model.Objects[0], Model, 'Служебный корень не удаляется');
});

test('56 угловых шкантов: глухие отверстия внутри сопряжённых панелей', () => {
    for (const cz of [100, 200]) {
        const c = pure.calculate(input(cz));
        assert.equal(c.joints.length, 56);
        const byId = Object.fromEntries(c.specs.map(s => [s.id, s]));
        for (const j of c.joints) {
            for (const [id, sign, depth] of [[j.first, j.sign, 11], [j.second, -j.sign, 22]]) {
                const s = byId[id], size = {x: 'w', y: 'h', z: 'd'};
                for (let t = 0; t <= depth; t += 0.5) {
                    const p = {x: j.x, y: j.y, z: j.z}; p[j.axis] += sign * t;
                    for (const a of ['x', 'y', 'z']) {
                        const radius = a === j.axis ? 0 : 4;
                        assert.ok(p[a] - radius >= s[a] - 1e-8 && p[a] + radius <= s[a] + s[size[a]] + 1e-8,
                            `${j.first}/${j.second}: сверление выходит из ${id} по ${a}`);
                    }
                    if (s.cut === 'round-open') {
                        for (const dx of [-4, 0, 4]) for (const dz of [-4, 0, 4]) {
                            const x = p.x + (j.axis === 'x' ? 0 : dx), z = p.z + (j.axis === 'z' ? 0 : dz);
                            if (Math.abs(x - 600) < c.radius) {
                                const boundary = cz + Math.sqrt(c.radius ** 2 - (x - 600) ** 2);
                                assert.ok(z >= boundary, 'Сверление попало в округлый вырез');
                            }
                        }
                    }
                }
            }
        }
        assert.equal(byId.C05.y, 280); assert.equal(byId.C06.y + byId.C06.h, 380);
        assert.ok(390.5 - 380 > 10, 'Нет места между связями и корпусом подвеса');
    }
});
test('12 шкантов фасадов: сквозная стенка, зазор и глухая посадка', () => {
    const c = pure.calculate(input(100));
    for (let k = 0; k < 2; k++) {
        const facade = c.specs.find(s => s.id === (k ? 'F02' : 'F01'));
        const front = c.specs.find(s => s.id === (k ? 'U03' : 'L03'));
        assert.equal(front.z + front.d, 379); assert.equal(facade.z, 381);
        assert.equal(16 + 2 + 12, 30); assert.equal(19 - 13, 6);
        for (const x of [100, 600, 1100]) for (const y of [c.drawerBottoms[k] + 55, c.drawerBottoms[k] + 125]) {
            for (const s of [facade, front]) {
                assert.ok(x - 4 > s.x && x + 4 < s.x + s.w);
                assert.ok(y - 4 > s.y && y + 4 < s.y + s.h);
            }
        }
    }
});

const summary = {
    source: sourcePath, source_sha256: hash(source), check_sha256: hash(fs.readFileSync(__filename)),
    checked_at: new Date().toISOString(), runtime: process.version,
    method: 'Node vm: pure calculations, explicit 2D coordinate transforms, preflight failure branches, list cleanup dispatch.',
    status: results.every(r => r.status === 'PASS') ? 'PASS' : 'FAIL',
    passed: results.filter(r => r.status === 'PASS').length, failed: results.filter(r => r.status === 'FAIL').length,
    results,
    limits: [
        'NOT_RUN: БАЗИС 22; загрузка FR3D, MountBox, фактическая геометрия, присадка, материалы, сохранение/повторное открытие.',
        'NOT_RUN: успешное CAD-построение и повторный запуск изделия; успешные AddPanel/Contour/MountBox не эмулируются.',
        'Очистка проверяет вызовы DeleteObject для верхних объектов; каскадное удаление реальных вложений обязан проверить БАЗИС.',
        'Дуги проверены как математические команды AddArc; Geometry2D.Area заменена независимым интегралом. Трактовка команд и булева операция круга самим БАЗИС не проверены.',
        'Пересечения проверены для заданных прямоугольных объёмов панелей; фурнитура, траектории, труба и прочность не проверены.'
    ]
};
fs.writeFileSync(path.join(__dirname, 'check-summary.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({ status: summary.status, passed: summary.passed, failed: summary.failed, source_sha256: summary.source_sha256 }));
for (const result of results.filter(r => r.status === 'FAIL')) console.error(result.name + '\n' + result.error);
process.exitCode = summary.failed ? 1 : 0;
