// Ревизия 02: свесы столешницы по бокам и спереди 2 мм, сзади 0 мм.
// FRM0444.S30 выбраны, но пока НЕ установлены. Крепёж отсутствует.
// Тумба vanity-1200 / эскиз 02 / скрипт 01. БАЗИС-Мебельщик 22.
// Ручной запуск в ПУСТОЙ модели. В БАЗИС пока не проверен.
// Справка: https://cdn.bazissoft.ru/documentation/ru/Script.pdf (2021).
// Старый глобальный API, без переключения версии API и без внешних библиотек.
// X вправо, Y вверх от низа тумбы, Z от стены к фасадам, миллиметры.
// Столешница — только габарит. Фурнитура, кромки и присадка отсутствуют.
(function () {
    var FLOOR_OFFSET = 300; // Поставьте 0 для начала координат на дне тумбы.
    var EPS = 0.01; // Только численный контроль скрипта, не производственный допуск.
    var specs = [
    {
        "id": "C01",
        "name": "Боковина левая",
        "x": 0,
        "y": 0,
        "z": 0,
        "w": 16,
        "h": 500,
        "d": 379,
        "color": "#bba78e",
        "group": "body",
        "axis": "X"
    },
    {
        "id": "C02",
        "name": "Боковина правая",
        "x": 1184,
        "y": 0,
        "z": 0,
        "w": 16,
        "h": 500,
        "d": 379,
        "color": "#bba78e",
        "group": "body",
        "axis": "X"
    },
    {
        "id": "C03",
        "name": "Дно корпуса",
        "x": 16,
        "y": 0,
        "z": 0,
        "w": 1168,
        "h": 16,
        "d": 379,
        "color": "#c7b79f",
        "group": "body",
        "axis": "Y"
    },
    {
        "id": "C04",
        "name": "Передняя верхняя связь",
        "x": 16,
        "y": 440,
        "z": 319,
        "w": 1168,
        "h": 60,
        "d": 16,
        "color": "#c7b79f",
        "group": "body",
        "axis": "Z"
    },
    {
        "id": "C05",
        "name": "Задняя связь левая",
        "x": 16,
        "y": 400,
        "z": 0,
        "w": 484,
        "h": 100,
        "d": 16,
        "color": "#c7b79f",
        "group": "body",
        "axis": "Z"
    },
    {
        "id": "C06",
        "name": "Задняя связь правая",
        "x": 700,
        "y": 400,
        "z": 0,
        "w": 484,
        "h": 100,
        "d": 16,
        "color": "#c7b79f",
        "group": "body",
        "axis": "Z"
    },
    {
        "id": "F01",
        "name": "Нижний фасад",
        "x": 2,
        "y": 2,
        "z": 381,
        "w": 1196,
        "h": 246.5,
        "d": 19,
        "color": "#eeeae2",
        "group": "lower",
        "axis": "Z"
    },
    {
        "id": "F02",
        "name": "Верхний фасад",
        "x": 2,
        "y": 251.5,
        "z": 381,
        "w": 1196,
        "h": 246.5,
        "d": 19,
        "color": "#eeeae2",
        "group": "upper",
        "axis": "Z"
    },
    {
        "id": "T01",
        "name": "Столешница: условный габарит",
        "x": -2,
        "y": 500,
        "z": 0,
        "w": 1204,
        "h": 40,
        "d": 402,
        "color": "#f9f9f5",
        "group": "top",
        "axis": "Y"
    },
    {
        "id": "L01",
        "name": "Бок ящика левый",
        "x": 42,
        "y": 61,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 235,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "X"
    },
    {
        "id": "L02",
        "name": "Бок ящика правый",
        "x": 1142,
        "y": 61,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 235,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "X"
    },
    {
        "id": "L03",
        "name": "Передняя стенка ящика",
        "x": 58,
        "y": 61,
        "z": 349,
        "w": 1084,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "Z"
    },
    {
        "id": "L04",
        "name": "Задняя стенка слева",
        "x": 58,
        "y": 61,
        "z": 130,
        "w": 426,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "Z"
    },
    {
        "id": "L05",
        "name": "Задняя стенка справа",
        "x": 716,
        "y": 61,
        "z": 130,
        "w": 426,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "Z"
    },
    {
        "id": "L06",
        "name": "Стенка выреза слева",
        "x": 484,
        "y": 61,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 186,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "X"
    },
    {
        "id": "L07",
        "name": "Стенка выреза справа",
        "x": 700,
        "y": 61,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 186,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "X"
    },
    {
        "id": "L08",
        "name": "Стенка выреза спереди",
        "x": 500,
        "y": 61,
        "z": 300,
        "w": 200,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "lower",
        "axis": "Z"
    },
    {
        "id": "U01",
        "name": "Бок ящика левый",
        "x": 42,
        "y": 291,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 235,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "X"
    },
    {
        "id": "U02",
        "name": "Бок ящика правый",
        "x": 1142,
        "y": 291,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 235,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "X"
    },
    {
        "id": "U03",
        "name": "Передняя стенка ящика",
        "x": 58,
        "y": 291,
        "z": 349,
        "w": 1084,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "Z"
    },
    {
        "id": "U04",
        "name": "Задняя стенка слева",
        "x": 58,
        "y": 291,
        "z": 130,
        "w": 426,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "Z"
    },
    {
        "id": "U05",
        "name": "Задняя стенка справа",
        "x": 716,
        "y": 291,
        "z": 130,
        "w": 426,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "Z"
    },
    {
        "id": "U06",
        "name": "Стенка выреза слева",
        "x": 484,
        "y": 291,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 186,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "X"
    },
    {
        "id": "U07",
        "name": "Стенка выреза справа",
        "x": 700,
        "y": 291,
        "z": 130,
        "w": 16,
        "h": 140,
        "d": 186,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "X"
    },
    {
        "id": "U08",
        "name": "Стенка выреза спереди",
        "x": 500,
        "y": 291,
        "z": 300,
        "w": 200,
        "h": 140,
        "d": 16,
        "color": "#c6b69d",
        "group": "upper",
        "axis": "Z"
    },
    {
        "id": "L09",
        "name": "Дно ящика П-образное цельное",
        "x": 42,
        "y": 45,
        "z": 130,
        "w": 1116,
        "h": 16,
        "d": 235,
        "axis": "Y",
        "notch": true
    },
    {
        "id": "U09",
        "name": "Дно ящика П-образное цельное",
        "x": 42,
        "y": 275,
        "z": 130,
        "w": 1116,
        "h": 16,
        "d": 235,
        "axis": "Y",
        "notch": true
    }
];
    var created = [], stage = 'проверка среды';

    function requireValue(ok, message) { if (!ok) throw new Error(message); }
    function number(v) { return typeof v === 'number' && isFinite(v); }
    function close(a, b) { return number(a) && Math.abs(a - b) <= EPS; }

    function verify(panel, s) {
        var lo = panel.GabMin, hi = panel.GabMax;
        requireValue(close(lo.x, s.x) && close(lo.y, s.y + FLOOR_OFFSET) && close(lo.z, s.z),
            s.id + ': неверное положение панели');
        requireValue(close(hi.x - lo.x, s.w) && close(hi.y - lo.y, s.h) && close(hi.z - lo.z, s.d),
            s.id + ': неверные размеры/ориентация панели');
    }

    function make(s) {
        stage = s.id + ' / ' + s.name;
        var y = s.y + FLOOR_OFFSET, p, thickness;
        if (s.axis === 'X') {
            thickness = s.w;
            p = AddVertPanel(s.z, y, s.z + s.d, y + s.h, s.x);
        } else if (s.axis === 'Y') {
            thickness = s.h;
            p = AddHorizPanel(s.x, s.z, s.x + s.w, s.z + s.d, y);
        } else {
            thickness = s.d;
            p = AddFrontPanel(s.x, y, s.x + s.w, y + s.h, s.z);
        }
        requireValue(!!p, 'Команда не вернула панель: ' + stage);
        created.push(p);
        p.Name = 'ЭСКИЗ ' + s.id + ' ' + s.name;
        p.ArtPos = s.id;
        // Это явные эскизные имена, а не артикулы из пользовательской базы.
        p.MaterialName = s.id === 'T01' ? 'ЭСКИЗ Акрил: габарит 40 мм' :
            (s.id === 'F01' || s.id === 'F02' ? 'ЭСКИЗ Фасад эмаль 19 мм' : 'ЭСКИЗ ЛДСП 16 мм');
        p.Thickness = thickness;
        p.Build();
        requireValue(close(p.Thickness, thickness), s.id + ': толщина не назначилась');
        // Направление наращивания толщины не предполагается: выравниваем
        // по фактическим глобальным границам панели в пустой корневой модели.
        var lo = p.GabMin;
        var dx = s.x - lo.x, dy = y - lo.y, dz = s.z - lo.z;
        requireValue(number(dx) && number(dy) && number(dz), s.id + ': недоступны границы');
        p.PositionX = p.PositionX + dx;
        p.PositionY = p.PositionY + dy;
        p.PositionZ = p.PositionZ + dz;
        p.Build();
        verify(p, s);

        if (s.notch) {
            // Цельное П-образное дно. Вырез открыт к стене, X=500..700,
            // Z=130..300. Переводим мировые точки в ЛСК панели, чтобы
            // не предполагать направление осей локального контура.
            var world = [[42,130],[500,130],[500,300],[700,300],
                         [700,130],[1158,130],[1158,365],[42,365]];
            var local = [], i, a, b;
            for (i = 0; i < world.length; i++) {
                a = p.ToObject(Vector(world[i][0], y, world[i][1]));
                requireValue(number(a.x) && number(a.y), s.id + ': ошибка преобразования контура');
                local.push([a.x, a.y]);
            }
            var area = 0;
            for (i = 0; i < local.length; i++) {
                a = local[i]; b = local[(i + 1) % local.length];
                area += a[0] * b[1] - b[0] * a[1];
            }
            if (area < 0) local.reverse();
            requireValue(close(Math.abs(area) / 2, 1116 * 235 - 200 * 170), s.id + ': площадь контура');
            p.Contour.Clear();
            for (i = 0; i < local.length; i++) {
                a = local[i]; b = local[(i + 1) % local.length];
                p.Contour.AddLine(a[0], a[1], b[0], b[1]);
            }
            p.Build();
            requireValue(p.Contour.Count === 8, s.id + ': контур должен иметь 8 рёбер');
            verify(p, s);
        }
    }

    try {
        requireValue(typeof Model !== 'undefined', 'Запустите файл в редакторе скриптов БАЗИС.');
        requireValue(Model.Count === 0, 'Нужна новая ПУСТАЯ модель. Текущие объекты не изменены.');
        requireValue(typeof AddVertPanel !== 'undefined' && typeof AddHorizPanel !== 'undefined' &&
            typeof AddFrontPanel !== 'undefined' && typeof Vector !== 'undefined',
            'В выбранном режиме недоступен глобальный API панелей. Версия API не переключалась.');
        requireValue(number(FLOOR_OFFSET), 'Некорректная отметка низа тумбы');
        requireValue(specs.length === 27, 'Неполная таблица деталей');
        var i, j, s, ids = {};
        for (i = 0; i < specs.length; i++) {
            s = specs[i];
            requireValue(!ids[s.id], 'Повтор ID ' + s.id); ids[s.id] = true;
            for (j = 0; j < 6; j++) {
                var key = ['x','y','z','w','h','d'][j];
                requireValue(number(s[key]) && (j < 3 || s[key] > 0), s.id + ': неверный ' + key);
            }
        }
        for (i = 0; i < specs.length; i++) make(specs[i]);
        requireValue(Model.Count === 27, 'Ожидалось 27 объектов, получено ' + Model.Count);
        for (i = 0; i < specs.length; i++) verify(created[i], specs[i]);
        alert('ЭСКИЗ: создано 27 панелей.\nТумба 1200 x 500 x 400 мм; столешница 1204 x 402 x 40 мм.\n' +
            'Низ тумбы: ' + FLOOR_OFFSET + ' мм.\nСохраните модель вручную и откройте повторно.\n' +
            'Фурнитура, кромки, присадка, сифон и прочность не проверены.');
    } catch (e) {
        alert('Построение остановлено. Этап: ' + stage + '\n' + String(e) +
            '\nСоздано панелей: ' + created.length + '. Частичный результат не готов.\n' +
            'Для повторного запуска создайте новый пустой документ.');
    }
})();
