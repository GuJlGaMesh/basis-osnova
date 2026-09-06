// vanity-1200 / ревизия 03 / БАЗИС-Мебельщик 22 / ЭСКИЗ.
// Проверка ввода и библиотеки -> полная очистка текущей модели -> построение.
// Нужное прежнее содержимое сохраните до запуска. Другие документы не меняются.
// Библиотека: lib/FRM0444.S30.fr3d из официального TBM_11_25.zip.
// Глобальный API: Script.pdf, 10.03.2021. API автоматически не переключается.
// X вправо, Y вверх от пола, Z от стены к фасадам; все размеры в мм.
(function () {
    var REV = '03', EPS = 0.02, FLOOR = 300;
    var LIBRARY = 'lib/FRM0444.S30.fr3d';
    var DOWEL_LIBRARY = 'lib/dowel-8x30.f3d', HANGER_LIBRARY = 'lib/camar-807-pair.fr3d';
    var stage = 'проверка среды', changed = false, made = [], hardware = [];

    function requireValue(ok, message) { if (!ok) throw new Error(message); }
    function finite(v) { return typeof v === 'number' && isFinite(v); }
    function close(a, b) { return finite(a) && Math.abs(a - b) <= EPS; }
    function askNumber(hint) {
        var raw = prompt(hint);
        if (raw === null || raw === undefined || /^\s*$/.test(String(raw))) {
            var cancel = new Error('Ввод отменён или оставлен пустым.');
            cancel.cancelled = true; throw cancel;
        }
        var text = String(raw).replace(/^\s+|\s+$/g, '').replace(',', '.');
        requireValue(/^\d+(\.\d+)?$/.test(text), 'Нужно положительное число: ' + hint);
        var n = Number(text);
        requireValue(finite(n) && n > 0, 'Недопустимый размер: ' + hint);
        return n;
    }

    // Чистый расчёт; в этой функции нет вызовов CAD.
    function calculate(input) {
        var c = { width: 1200, height: 500, depth: 379, t: 16,
            nl: 300, front: 379, drawerBottoms: [45, 275], drawerHeight: 156 };
        requireValue(input.scope === 1 || input.scope === 2, 'Вариант выреза: только 1 или 2.');
        requireValue(finite(input.centerZ) && input.centerZ > 0, 'Нужна координата центра выреза от стены.');
        requireValue(finite(input.diameter) && input.diameter > 0, 'Нужен диаметр выреза.');
        c.opening = c.width - 2 * c.t;
        c.innerWidth = c.opening - 42;
        c.outerWidth = c.innerWidth + 2 * c.t;
        c.sideGap = (c.opening - c.outerWidth) / 2;
        c.left = c.t + c.sideGap;
        c.right = c.left + c.outerWidth;
        c.drawerDepth = c.nl - 10;
        c.back = c.front - c.drawerDepth;
        c.bottomBack = c.back + c.t;
        c.bottomFront = c.front - c.t;
        c.bottomRecess = 12;
        // База библиотечной секции задана передним краем корпуса:
        // её отверстия уже находятся на -37 мм, задние зацепы на -290 мм.
        c.runnerFront = c.front;
        c.radius = input.diameter / 2;
        c.centerX = c.width / 2;
        c.centerZ = input.centerZ;
        c.scope = input.scope;
        requireValue(c.depth >= c.nl + 5, 'Недостаточно глубины для FRM0444.S30.');
        requireValue(c.radius < c.innerWidth / 2 - 75, 'Вырез занимает зоны креплений направляющих.');
        requireValue(c.centerZ + c.radius > c.bottomBack + EPS, 'Вырез целиком позади дна ящика; проверьте центр и диаметр.');
        requireValue(c.centerZ + c.radius < c.bottomFront - 26, 'Вырез пересекает переднюю стенку ящика или зону её шкантов.');
        if (c.scope === 2) {
            requireValue(c.centerZ - c.radius > 0 && c.centerZ + c.radius < c.depth,
                'Круглое отверстие должно целиком находиться внутри дна корпуса.');
        }
        c.specs = [];
        function add(id, name, axis, x, y, z, w, h, d, cut) {
            var s = { id: id, name: name, axis: axis, x: x, y: y, z: z, w: w, h: h, d: d, cut: cut || '' };
            var keys = ['x', 'y', 'z', 'w', 'h', 'd'];
            for (var j = 0; j < keys.length; j++) {
                requireValue(finite(s[keys[j]]) && (j < 3 || s[keys[j]] > 0), id + ': неверный размер ' + keys[j]);
            }
            c.specs.push(s);
        }
        add('C01', 'Боковина левая', 'X', 0, 0, 0, 16, 500, 379);
        add('C02', 'Боковина правая', 'X', 1184, 0, 0, 16, 500, 379);
        add('C03', 'Дно корпуса', 'Y', 16, 0, 0, 1168, 16, 379, c.scope === 2 ? 'circle' : '');
        add('C04', 'Передняя верхняя связь', 'Z', 16, 440, 319, 1168, 60, 16);
        // Верхние задние углы заняты Camar 807; связи опущены на 120 мм.
        add('C05', 'Задняя связь левая', 'Z', 16, 280, 0, 484, 100, 16);
        add('C06', 'Задняя связь правая', 'Z', 700, 280, 0, 484, 100, 16);
        add('F01', 'Нижний фасад', 'Z', 2, 2, 381, 1196, 246.5, 19);
        add('F02', 'Верхний фасад', 'Z', 2, 251.5, 381, 1196, 246.5, 19);
        add('T01', 'Столешница: условный габарит', 'Y', -2, 500, 0, 1204, 40, 402);
        for (var k = 0; k < c.drawerBottoms.length; k++) {
            var pre = k === 0 ? 'L' : 'U', y = c.drawerBottoms[k];
            var by = y + c.bottomRecess, top = y + c.drawerHeight;
            // Задняя стенка имеет открытый проход под коммуникации.
            // Неподтверждённый криволинейный бортик не подменяется панелями.
            var halfGap = c.radius;
            if (c.centerZ < c.back) halfGap = Math.sqrt(c.radius * c.radius - Math.pow(c.back - c.centerZ, 2));
            add(pre + '01', 'Бок ящика левый, NL300', 'X', c.left, y, c.back, 16, c.drawerHeight, c.drawerDepth);
            add(pre + '02', 'Бок ящика правый, NL300', 'X', c.right - 16, y, c.back, 16, c.drawerHeight, c.drawerDepth);
            add(pre + '03', 'Передняя стенка ящика', 'Z', c.left + 16, by, c.bottomFront, c.innerWidth, top - by, 16);
            add(pre + '04', 'Задняя стенка слева', 'Z', c.left + 16, by, c.back, c.centerX - halfGap - c.left - 16, top - by, 16);
            add(pre + '05', 'Задняя стенка справа', 'Z', c.centerX + halfGap, by, c.back, c.right - 16 - c.centerX - halfGap, top - by, 16);
            add(pre + '09', 'Дно вставное, округлый открытый вырез', 'Y', c.left + 16, by, c.bottomBack,
                c.innerWidth, 16, c.bottomFront - c.bottomBack, 'round-open');
        }
        requireValue(c.specs.length === 21, 'Неполный состав панелей.');
        c.joints = [];
        function joint(first, second, x, y, z, axis, sign) {
            // sign задаёт направление от стыка в первую панель (пласть).
            c.joints.push({ first: first, second: second, x: x, y: y, z: z, axis: axis, sign: sign });
        }
        var zz = [50, 189.5, 329], ii;
        for (ii = 0; ii < zz.length; ii++) {
            joint('C01', 'C03', 16, 8, zz[ii], 'x', -1);
            joint('C02', 'C03', 1184, 8, zz[ii], 'x', 1);
        }
        for (ii = 0; ii < 2; ii++) {
            joint('C01', 'C04', 16, 455 + ii * 30, 327, 'x', -1);
            joint('C02', 'C04', 1184, 455 + ii * 30, 327, 'x', 1);
            joint('C01', 'C05', 16, 305 + ii * 50, 8, 'x', -1);
            joint('C02', 'C06', 1184, 305 + ii * 50, 8, 'x', 1);
        }
        for (k = 0; k < 2; k++) {
            pre = k === 0 ? 'L' : 'U'; y = c.drawerBottoms[k];
            for (ii = 0; ii < 2; ii++) {
                var jy = y + 45 + ii * 75;
                joint(pre + '01', pre + '03', c.left + 16, jy, c.front - 8, 'x', -1);
                joint(pre + '02', pre + '03', c.right - 16, jy, c.front - 8, 'x', 1);
                joint(pre + '01', pre + '04', c.left + 16, jy, c.back + 8, 'x', -1);
                joint(pre + '02', pre + '05', c.right - 16, jy, c.back + 8, 'x', 1);
            }
            var bottomAxisY = y + c.bottomRecess + 8;
            for (ii = 0; ii < 3; ii++) {
                var jz = c.bottomBack + 32 + ii * (c.bottomFront - c.bottomBack - 64) / 2;
                joint(pre + '01', pre + '09', c.left + 16, bottomAxisY, jz, 'x', -1);
                joint(pre + '02', pre + '09', c.right - 16, bottomAxisY, jz, 'x', 1);
                joint(pre + '03', pre + '09', c.left + 16 + c.innerWidth * (ii + 1) / 4,
                    bottomAxisY, c.bottomFront, 'z', 1);
            }
            var safeWing = c.centerX - c.radius - (c.left + 16);
            for (ii = 0; ii < 2; ii++) {
                var jx = c.left + 16 + safeWing * (ii + 1) / 3;
                joint(pre + '04', pre + '09', jx, bottomAxisY, c.bottomBack, 'z', -1);
                joint(pre + '05', pre + '09', c.width - jx, bottomAxisY, c.bottomBack, 'z', -1);
            }
        }
        requireValue(c.joints.length === 56, 'Неполная схема шкантов корпуса и коробов.');
        return c;
    }

    function objects(list) {
        requireValue(list && finite(list.Count) && list.Count >= 0 && list.Objects !== undefined,
            'Не удалось прочитать объекты текущей модели.');
        var a = [];
        for (var i = 0; i < list.Count; i++) {
            var o = list.Objects[i];
            requireValue(!!o, 'Недоступен объект текущей модели ' + i);
            // Сам служебный корень не является пользовательским объектом.
            if (o !== list && o !== Model) a.push(o);
        }
        return a;
    }
    function clearCurrentModel() {
        stage = 'очистка текущей модели';
        var old = objects(Model);
        changed = true;
        for (var i = old.length - 1; i >= 0; i--) DeleteObject(old[i]);
        requireValue(objects(Model).length === 0, 'Очистка не завершилась. Новые детали не создавались.');
    }
    function verify(p, s) {
        var lo = p.GabMin, hi = p.GabMax;
        requireValue(lo && hi && close(lo.x, s.x) && close(lo.y, s.y + FLOOR) && close(lo.z, s.z), s.id + ': неверное положение');
        requireValue(close(hi.x - lo.x, s.w) && close(hi.y - lo.y, s.h) && close(hi.z - lo.z, s.d), s.id + ': неверный размер/ориентация');
    }
    function localPoint(p, x, z, y) {
        var v = p.ToObject(Vector(x, y, z));
        requireValue(v && finite(v.x) && finite(v.y), 'Ошибка перевода контура в локальные координаты.');
        return Vector(v.x, v.y, 0);
    }
    function roundOpen(p, s, c) {
        var y = s.y + FLOOR, left = c.centerX - c.radius, right = c.centerX + c.radius;
        var arcZ = c.centerZ;
        if (arcZ < s.z) {
            var halfChord = Math.sqrt(c.radius * c.radius - Math.pow(s.z - c.centerZ, 2));
            left = c.centerX - halfChord; right = c.centerX + halfChord; arcZ = s.z;
        }
        var segments = [];
        function line(x1, z1, x2, z2) {
            if (Math.abs(x1 - x2) + Math.abs(z1 - z2) > EPS) segments.push({ a: [x1, z1], b: [x2, z2] });
        }
        line(s.x, s.z, left, s.z);
        line(left, s.z, left, arcZ);
        segments.push({ a: [left, arcZ], mid: [c.centerX, c.centerZ + c.radius], b: [right, arcZ] });
        line(right, arcZ, right, s.z);
        line(right, s.z, s.x + s.w, s.z);
        line(s.x + s.w, s.z, s.x + s.w, s.z + s.d);
        line(s.x + s.w, s.z + s.d, s.x, s.z + s.d);
        line(s.x, s.z + s.d, s.x, s.z);
        // Нормаль горизонтальной панели может менять ориентацию обхода.
        var a = localPoint(p, s.x, s.z, y), b = localPoint(p, s.x + s.w, s.z, y);
        var q = localPoint(p, s.x, s.z + s.d, y);
        var reverse = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x) < 0;
        if (reverse) segments.reverse();
        p.Contour.Clear();
        for (var i = 0; i < segments.length; i++) {
            var e = segments[i];
            a = localPoint(p, (reverse ? e.b : e.a)[0], (reverse ? e.b : e.a)[1], y);
            b = localPoint(p, (reverse ? e.a : e.b)[0], (reverse ? e.a : e.b)[1], y);
            // Внутренняя дуга при положительном обходе наружного контура
            // идёт по часовой стрелке: ArcDir=false (Script.pdf, стр.166).
            if (e.mid) p.Contour.AddArc(a, b, localPoint(p, c.centerX, c.centerZ, y), false);
            else p.Contour.AddLine(a.x, a.y, b.x, b.y);
        }
        requireValue(p.Contour.Count === segments.length, s.id + ': неполный округлый контур.');
        var removed;
        if (c.centerZ >= s.z) removed = 2 * c.radius * (c.centerZ - s.z) + Math.PI * c.radius * c.radius / 2;
        else {
            var offset = s.z - c.centerZ;
            removed = c.radius * c.radius * Math.acos(offset / c.radius) - offset * Math.sqrt(c.radius * c.radius - offset * offset);
        }
        requireValue(Math.abs(Math.abs(Geometry2D.Area(p.Contour)) - (s.w * s.d - removed)) <= 0.1,
            s.id + ': неверная площадь округлого выреза.');
    }
    function make(s, c) {
        stage = s.id + ' / ' + s.name;
        var y = s.y + FLOOR, p, thickness;
        if (s.axis === 'X') { thickness = s.w; p = AddVertPanel(s.z, y, s.z + s.d, y + s.h, s.x); }
        else if (s.axis === 'Y') { thickness = s.h; p = AddHorizPanel(s.x, s.z, s.x + s.w, s.z + s.d, y); }
        else { thickness = s.d; p = AddFrontPanel(s.x, y, s.x + s.w, y + s.h, s.z); }
        requireValue(!!p, 'Не создана панель ' + s.id); made.push(p);
        p.Name = 'ЭСКИЗ ' + s.id + ' ' + s.name; p.ArtPos = s.id;
        p.MaterialName = s.id === 'T01' ? 'ЭСКИЗ Акрил: габарит 40 мм' :
            (s.id === 'F01' || s.id === 'F02' ? 'ЭСКИЗ Фасад эмаль 19 мм' : 'ЭСКИЗ ЛДСП 16 мм');
        p.Thickness = thickness; p.Build();
        var lo = p.GabMin;
        requireValue(lo && finite(lo.x) && finite(lo.y) && finite(lo.z), s.id + ': нет границ панели');
        p.PositionX += s.x - lo.x; p.PositionY += y - lo.y; p.PositionZ += s.z - lo.z;
        p.Build(); verify(p, s);
        if (s.cut === 'round-open') roundOpen(p, s, c);
        if (s.cut === 'circle') {
            var hole = NewContour(), center = localPoint(p, c.centerX, c.centerZ, y);
            hole.AddCircle(center.x, center.y, c.radius);
            // В описании Script.pdf: Subtraction; в примере того же руководства: Substraction.
            if (typeof p.Contour.Subtraction !== 'undefined') p.Contour.Subtraction(hole);
            else if (typeof p.Contour.Substraction !== 'undefined') p.Contour.Substraction(hole);
            else throw new Error('В профиле API нет документированной операции вычитания контура.');
            requireValue(p.Contour.Count > 4, 'Круглый вырез не появился в контуре C03.');
        }
        p.Build(); verify(p, s);
        return p;
    }
    function mountPair(furniture, c, index) {
        stage = 'Firmax FRM0444.S30 / пара ' + (index + 1);
        var before = objects(Model);
        var railY = FLOOR + c.drawerBottoms[index] + c.bottomRecess - 27;
        // Родная секция растягивает расстояние между двумя направляющими по X.
        // Длина направляющих и прочие размеры фурнитуры не масштабируются.
        furniture.MountBox(Vector(16, railY, c.runnerFront), Vector(c.opening, 0, 0),
            Vector(0, 0, 1), Vector(0, 1, 0));
        var after = objects(Model), added = [];
        for (var i = 0; i < after.length; i++) {
            var found = false;
            for (var j = 0; j < before.length; j++) if (before[j] === after[i]) found = true;
            if (!found) added.push(after[i]);
        }
        requireValue(added.length > 0, 'Библиотечная пара не установилась.');
        var lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
        for (i = 0; i < added.length; i++) {
            var o = added[i], mn = o.GabMin, mx = o.GabMax;
            requireValue(mn && mx, 'Нет границ установленной фурнитуры.');
            for (j = 0; j < 3; j++) {
                var axis = ['x', 'y', 'z'][j];
                requireValue(finite(mn[axis]) && finite(mx[axis]), 'Некорректные границы фурнитуры.');
                lo[axis] = Math.min(lo[axis], mn[axis]); hi[axis] = Math.max(hi[axis], mx[axis]);
            }
            hardware.push(o);
        }
        // По геометрии исходного библиотечного фрагмента: 300×50 по Z/Y,
        // передняя плоскость Z=0, задняя=-300; пары на гранях X=0 и X=Width.
        requireValue(close(lo.x, 16) && close(hi.x, 1184) && close(lo.z, c.runnerFront - 300) && close(hi.z, c.runnerFront),
            'Не совпали монтажные базы или размер секции FRM0444.S30. Проверьте библиотеку и профиль API.');
        requireValue(close(lo.y, railY) && close(hi.y, railY + 50), 'Неверная высотная база FRM0444.S30.');
    }
    function addedSince(before) {
        var all = objects(Model), added = [];
        for (var i = 0; i < all.length; i++) {
            var old = false;
            for (var j = 0; j < before.length; j++) if (all[i] === before[j]) old = true;
            if (!old) added.push(all[i]);
        }
        return added;
    }
    function eachFastener(obj, result) {
        if (obj instanceof TFastener) { result.push(obj); return; }
        if (obj.List) {
            var list = obj.AsList;
            for (var i = 0; i < list.Count; i++) eachFastener(list.Objects[i], result);
        }
    }
    function setDrill(f, index, point, direction, depth, mode, diameter) {
        requireValue(f.Holes && f.Holes.Count === 2 && f.Holes.List && typeof f.DrillHoles !== 'undefined',
            'Шаблон шканта должен содержать два редактируемых отверстия.');
        var h = f.Holes.List[index];
        h.Position = f.ToObject(point); h.Direction = f.NToObject(direction);
        h.Diameter = diameter; h.Depth = depth; h.DrillMode = mode;
        var actual = f.ToGlobal(h.Position), normal = f.NToGlobal(h.Direction);
        requireValue(close(actual.x, point.x) && close(actual.y, point.y) && close(actual.z, point.z) &&
            close(normal.x, direction.x) && close(normal.y, direction.y) && close(normal.z, direction.z) &&
            close(h.Diameter, diameter) && close(h.Depth, depth) && h.DrillMode === mode,
            'Профиль API не принял параметры присадки.');
    }
    function dowelBody(name, start, direction) {
        var p = AddExtrusion(name);
        p.Contour.AddCircle(0, 0, 4); p.Thickness = 30; p.MaterialName = 'Шкант деревянный 8x30, на клею';
        var up = Math.abs(direction.y) > 0.5 ? Vector(0, 0, 1) : Vector(0, 1, 0);
        p.OrientGCS(direction, up); p.Build();
        var end = Vector(start.x + 30 * direction.x, start.y + 30 * direction.y, start.z + 30 * direction.z);
        var target = {}, axes = ['x', 'y', 'z'];
        for (var i = 0; i < axes.length; i++) {
            var a = axes[i]; target[a] = Math.min(start[a], end[a]) - (Math.abs(direction[a]) < 0.5 ? 4 : 0);
        }
        var lo = p.GabMin;
        p.PositionX += target.x - lo.x; p.PositionY += target.y - lo.y; p.PositionZ += target.z - lo.z;
        p.Build();
        var hi = p.GabMax; lo = p.GabMin;
        for (i = 0; i < axes.length; i++) {
            a = axes[i];
            requireValue(close(lo[a], target[a]) && close(hi[a] - lo[a], Math.abs(direction[a]) > 0.5 ? 30 : 8),
                name + ': неверная геометрия шканта');
        }
        return p;
    }
    function addDowel(seed, id, p1, n1, depth1, mode1, p2, n2, depth2, start, axis) {
        var block = AddBlock(id + ' Шкант 8x30 на клею');
        block.IsFastener = true; block.ArtPos = id; hardware.push(block);
        var f = AddCopy(seed); f.Owner = block; f.Name = id + ' Присадка';
        setDrill(f, 0, p1, n1, depth1, mode1, 8);
        setDrill(f, 1, p2, n2, depth2, 2, 8);
        var body = dowelBody(id + ' Деревянный шкант 8x30', start, axis); body.Owner = block;
        f.DrillHoles(); block.Build();
    }
    function mountDowels(furniture, c, panels) {
        stage = 'шканты на клею / подготовка родного шаблона присадки';
        var before = objects(Model);
        furniture.Mount(panels.C01, panels.C03, 16, FLOOR + 8, 50);
        var temporary = addedSince(before), found = [];
        for (var i = 0; i < temporary.length; i++) eachFastener(temporary[i], found);
        requireValue(found.length === 1 && found[0].Holes.Count === 2, 'Не получен шаблон двух отверстий шканта.');
        var seed = found[0];
        for (i = 0; i < c.joints.length; i++) {
            var j = c.joints[i], id = 'D' + (i + 1);
            stage = id + ': ' + j.first + ' / ' + j.second;
            var n = { x: 0, y: 0, z: 0 }; n[j.axis] = j.sign;
            var p = Vector(j.x, j.y + FLOOR, j.z);
            // 10+20 мм древесины; отверстия 11+22 мм с запасом под клей.
            addDowel(seed, id, p, Vector(n.x, n.y, n.z), 11, 2,
                p, Vector(-n.x, -n.y, -n.z), 22,
                Vector(p.x + 10 * n.x, p.y + 10 * n.y, p.z + 10 * n.z), Vector(-n.x, -n.y, -n.z));
        }
        for (var drawer = 0; drawer < 2; drawer++) {
            for (var row = 0; row < 2; row++) {
                for (var col = 0; col < 3; col++) {
                    var x = 100 + col * 500, y = FLOOR + c.drawerBottoms[drawer] + 55 + row * 70;
                    id = (drawer === 0 ? 'FL' : 'FU') + (row * 3 + col + 1);
                    stage = id + ': шкант крепления фасада';
                    // 16 насквозь + зазор 2 + 12 в фасад = 30; глухое сверление 13.
                    addDowel(seed, id, Vector(x, y, 379), Vector(0, 0, -1), 16, 1,
                        Vector(x, y, 381), Vector(0, 0, 1), 13, Vector(x, y, 363), Vector(0, 0, 1));
                }
            }
        }
        // Удаляется только вспомогательный экземпляр, его копии уже самостоятельны.
        for (i = temporary.length - 1; i >= 0; i--) DeleteObject(temporary[i]);
    }
    function mountHangers(furniture, c) {
        stage = 'Camar 807 / пара подвесов с планками и заглушками';
        var before = objects(Model);
        // Родная рамка 150x100x0 с нижней базой Y=-100; её верх совмещён с Y=500.
        furniture.MountBox(Vector(16, FLOOR + 400, 0), Vector(c.opening, 100, 0), Vector(0, 0, 1), Vector(0, 1, 0));
        var added = addedSince(before);
        requireValue(added.length > 0, 'Секция Camar 807 не установилась.');
        for (var i = 0; i < added.length; i++) hardware.push(added[i]);
        // Общий AABB содержит служебные траектории вырезов из библиотеки;
        // реальные механизмы/планки/заглушки измеряются отдельно в БАЗИС по run.md.
    }
    try {
        requireValue(typeof Model !== 'undefined' && !!Model, 'Нет текущего документа БАЗИС.');
        requireValue(typeof AddVertPanel !== 'undefined' && typeof AddHorizPanel !== 'undefined' &&
            typeof AddFrontPanel !== 'undefined' && typeof Vector !== 'undefined' &&
            typeof DeleteObject !== 'undefined' && typeof OpenFurniture !== 'undefined' &&
            typeof NewContour !== 'undefined' && typeof prompt !== 'undefined' && typeof DatumMode !== 'undefined' &&
            typeof Geometry2D !== 'undefined' && typeof Geometry2D.Area !== 'undefined' &&
            typeof AddBlock !== 'undefined' && typeof AddCopy !== 'undefined' && typeof AddExtrusion !== 'undefined' &&
            typeof TFastener !== 'undefined',
            'Недоступен требуемый глобальный API. Автоматическое переключение версии не выполняется.');
        objects(Model);
        stage = 'ввод размеров выреза';
        var input = {};
        input.scope = askNumber('Вырез по центру: 1 — округлый, открытый назад в обоих ящиках; 2 — то же и круглый в дне корпуса. Замкнутый круг вокруг трубы блокирует движение ящика. Введите 1 или 2; отмена сохранит модель.');
        input.centerZ = askNumber('Расстояние от стены ДО ЦЕНТРА выреза, мм. Указанные 100 мм ранее обозначали выступ канализации; введите 100 только если это также координата центра сифона.');
        input.diameter = askNumber('Диаметр округлого выреза, мм, с учётом раструба/сифона и монтажного зазора.');
        var c = calculate(input);
        stage = 'проверка библиотеки Firmax';
        var furniture = OpenFurniture(LIBRARY);
        requireValue(furniture && furniture.DatumMode === DatumMode.Box && typeof furniture.MountBox !== 'undefined',
            'Нужен приложенный секционный фрагмент lib/FRM0444.S30.fr3d. Он должен открываться в этой сборке БАЗИС.');
        var dowels = OpenFurniture(DOWEL_LIBRARY), hangers = OpenFurniture(HANGER_LIBRARY);
        requireValue(dowels && dowels.DatumMode === DatumMode.FaceFace && typeof dowels.Mount !== 'undefined',
            'Недоступен приложенный шаблон шканта 8x30.');
        requireValue(hangers && hangers.DatumMode === DatumMode.Box && typeof hangers.MountBox !== 'undefined',
            'Недоступен приложенный комплект Camar 807.');
        clearCurrentModel();
        var panels = {};
        for (var i = 0; i < c.specs.length; i++) panels[c.specs[i].id] = make(c.specs[i], c);
        mountPair(furniture, c, 0); mountPair(furniture, c, 1);
        mountHangers(hangers, c); mountDowels(dowels, c, panels);
        for (i = 0; i < c.specs.length; i++) verify(made[i], c.specs[i]);
        requireValue(objects(Model).length === made.length + hardware.length, 'Не совпал состав текущей модели.');
        alert('ЭСКИЗ vanity-1200, ревизия ' + REV + '.\nСоздано 21 панель (включая 2 фасада), 2 пары Firmax FRM0444.S30, Camar 807 и 68 шкантов на клею.\n' +
            'Направляющие 300 мм; короба 1158 x 290 мм. Вырез по X=600, Z=' + c.centerZ + ', диаметр ' + input.diameter + '.\n' +
            'Сохраните модель под новым именем и проверьте по run.md.\nАнкеры стены, технология клея, защита выреза, кромки, присадка и прочность требуют проверки.');
    } catch (e) {
        alert((e.cancelled ? 'Ввод отменён.' : 'Построение остановлено: ' + stage + '\n' + String(e)) +
            (changed ? '\nТекущая модель уже изменена; результат не завершён. Панелей: ' + made.length + '. Следующий запуск снова очистит её.' : '\nОчистка и построение не выполнялись.') +
            '\nРевизия ' + REV + '.');
    }
})();
