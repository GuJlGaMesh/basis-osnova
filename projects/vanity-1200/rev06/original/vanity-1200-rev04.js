// vanity-1200 / revision 04 / BAZIS 22 / ASCII-safe source.
// \u041f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0432\u0432\u043e\u0434\u0430 \u0438 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0438 -> \u043f\u043e\u043b\u043d\u0430\u044f \u043e\u0447\u0438\u0441\u0442\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043c\u043e\u0434\u0435\u043b\u0438 -> \u043f\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435.
// \u041d\u0443\u0436\u043d\u043e\u0435 \u043f\u0440\u0435\u0436\u043d\u0435\u0435 \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u043c\u043e\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u0434\u043e \u0437\u0430\u043f\u0443\u0441\u043a\u0430. \u0414\u0440\u0443\u0433\u0438\u0435 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u044b \u043d\u0435 \u043c\u0435\u043d\u044f\u044e\u0442\u0441\u044f.
// \u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0430: lib/FRM0444.S30.fr3d \u0438\u0437 \u043e\u0444\u0438\u0446\u0438\u0430\u043b\u044c\u043d\u043e\u0433\u043e TBM_11_25.zip.
// \u0413\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u0439 API: Script.pdf, 10.03.2021. API \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438 \u043d\u0435 \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0430\u0435\u0442\u0441\u044f.
// X \u0432\u043f\u0440\u0430\u0432\u043e, Y \u0432\u0432\u0435\u0440\u0445 \u043e\u0442 \u043f\u043e\u043b\u0430, Z \u043e\u0442 \u0441\u0442\u0435\u043d\u044b \u043a \u0444\u0430\u0441\u0430\u0434\u0430\u043c; \u0432\u0441\u0435 \u0440\u0430\u0437\u043c\u0435\u0440\u044b \u0432 \u043c\u043c.
(function () {
    var REV = '04', EPS = 0.02, FLOOR = 300;
    var LIBRARY = 'lib/FRM0444.S30.fr3d';
    var DOWEL_LIBRARY = 'lib/dowel-8x30.f3d', HANGER_LIBRARY = 'lib/camar-807-pair.fr3d';
    var stage = '\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0441\u0440\u0435\u0434\u044b', changed = false, made = [], hardware = [];

    function requireValue(ok, message) { if (!ok) throw new Error(message); }
    function finite(v) { return typeof v === 'number' && isFinite(v); }
    function close(a, b) { return finite(a) && Math.abs(a - b) <= EPS; }
    function askNumber(hint) {
        var raw = prompt(hint);
        if (raw === null || raw === undefined || /^\s*$/.test(String(raw))) {
            var cancel = new Error('\u0412\u0432\u043e\u0434 \u043e\u0442\u043c\u0435\u043d\u0451\u043d \u0438\u043b\u0438 \u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d \u043f\u0443\u0441\u0442\u044b\u043c.');
            cancel.cancelled = true; throw cancel;
        }
        var text = String(raw).replace(/^\s+|\s+$/g, '').replace(',', '.');
        requireValue(/^\d+(\.\d+)?$/.test(text), '\u041d\u0443\u0436\u043d\u043e \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u0435 \u0447\u0438\u0441\u043b\u043e: ' + hint);
        var n = Number(text);
        requireValue(finite(n) && n > 0, '\u041d\u0435\u0434\u043e\u043f\u0443\u0441\u0442\u0438\u043c\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440: ' + hint);
        return n;
    }

    // \u0427\u0438\u0441\u0442\u044b\u0439 \u0440\u0430\u0441\u0447\u0451\u0442; \u0432 \u044d\u0442\u043e\u0439 \u0444\u0443\u043d\u043a\u0446\u0438\u0438 \u043d\u0435\u0442 \u0432\u044b\u0437\u043e\u0432\u043e\u0432 CAD.
    function calculate(input) {
        var c = { width: 1200, height: 500, depth: 379, t: 16,
            nl: 300, front: 379, drawerBottoms: [45, 275], drawerHeight: 156 };
        requireValue(input.scope === 1 || input.scope === 2, '\u0412\u0430\u0440\u0438\u0430\u043d\u0442 \u0432\u044b\u0440\u0435\u0437\u0430: \u0442\u043e\u043b\u044c\u043a\u043e 1 \u0438\u043b\u0438 2.');
        requireValue(finite(input.centerZ) && input.centerZ > 0, '\u041d\u0443\u0436\u043d\u0430 \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u0430 \u0446\u0435\u043d\u0442\u0440\u0430 \u0432\u044b\u0440\u0435\u0437\u0430 \u043e\u0442 \u0441\u0442\u0435\u043d\u044b.');
        requireValue(finite(input.diameter) && input.diameter > 0, '\u041d\u0443\u0436\u0435\u043d \u0434\u0438\u0430\u043c\u0435\u0442\u0440 \u0432\u044b\u0440\u0435\u0437\u0430.');
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
        // \u0411\u0430\u0437\u0430 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u0447\u043d\u043e\u0439 \u0441\u0435\u043a\u0446\u0438\u0438 \u0437\u0430\u0434\u0430\u043d\u0430 \u043f\u0435\u0440\u0435\u0434\u043d\u0438\u043c \u043a\u0440\u0430\u0435\u043c \u043a\u043e\u0440\u043f\u0443\u0441\u0430:
        // \u0435\u0451 \u043e\u0442\u0432\u0435\u0440\u0441\u0442\u0438\u044f \u0443\u0436\u0435 \u043d\u0430\u0445\u043e\u0434\u044f\u0442\u0441\u044f \u043d\u0430 -37 \u043c\u043c, \u0437\u0430\u0434\u043d\u0438\u0435 \u0437\u0430\u0446\u0435\u043f\u044b \u043d\u0430 -290 \u043c\u043c.
        c.runnerFront = c.front;
        c.radius = input.diameter / 2;
        c.centerX = c.width / 2;
        c.centerZ = input.centerZ;
        c.scope = input.scope;
        requireValue(c.depth >= c.nl + 5, '\u041d\u0435\u0434\u043e\u0441\u0442\u0430\u0442\u043e\u0447\u043d\u043e \u0433\u043b\u0443\u0431\u0438\u043d\u044b \u0434\u043b\u044f FRM0444.S30.');
        requireValue(c.radius < c.innerWidth / 2 - 75, '\u0412\u044b\u0440\u0435\u0437 \u0437\u0430\u043d\u0438\u043c\u0430\u0435\u0442 \u0437\u043e\u043d\u044b \u043a\u0440\u0435\u043f\u043b\u0435\u043d\u0438\u0439 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0449\u0438\u0445.');
        requireValue(c.centerZ + c.radius > c.bottomBack + EPS, '\u0412\u044b\u0440\u0435\u0437 \u0446\u0435\u043b\u0438\u043a\u043e\u043c \u043f\u043e\u0437\u0430\u0434\u0438 \u0434\u043d\u0430 \u044f\u0449\u0438\u043a\u0430; \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0446\u0435\u043d\u0442\u0440 \u0438 \u0434\u0438\u0430\u043c\u0435\u0442\u0440.');
        requireValue(c.centerZ + c.radius < c.bottomFront - 26, '\u0412\u044b\u0440\u0435\u0437 \u043f\u0435\u0440\u0435\u0441\u0435\u043a\u0430\u0435\u0442 \u043f\u0435\u0440\u0435\u0434\u043d\u044e\u044e \u0441\u0442\u0435\u043d\u043a\u0443 \u044f\u0449\u0438\u043a\u0430 \u0438\u043b\u0438 \u0437\u043e\u043d\u0443 \u0435\u0451 \u0448\u043a\u0430\u043d\u0442\u043e\u0432.');
        if (c.scope === 2) {
            requireValue(c.centerZ - c.radius > 0 && c.centerZ + c.radius < c.depth,
                '\u041a\u0440\u0443\u0433\u043b\u043e\u0435 \u043e\u0442\u0432\u0435\u0440\u0441\u0442\u0438\u0435 \u0434\u043e\u043b\u0436\u043d\u043e \u0446\u0435\u043b\u0438\u043a\u043e\u043c \u043d\u0430\u0445\u043e\u0434\u0438\u0442\u044c\u0441\u044f \u0432\u043d\u0443\u0442\u0440\u0438 \u0434\u043d\u0430 \u043a\u043e\u0440\u043f\u0443\u0441\u0430.');
        }
        c.specs = [];
        function add(id, name, axis, x, y, z, w, h, d, cut) {
            var s = { id: id, name: name, axis: axis, x: x, y: y, z: z, w: w, h: h, d: d, cut: cut || '' };
            var keys = ['x', 'y', 'z', 'w', 'h', 'd'];
            for (var j = 0; j < keys.length; j++) {
                requireValue(finite(s[keys[j]]) && (j < 3 || s[keys[j]] > 0), id + ': \u043d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440 ' + keys[j]);
            }
            c.specs.push(s);
        }
        add('C01', '\u0411\u043e\u043a\u043e\u0432\u0438\u043d\u0430 \u043b\u0435\u0432\u0430\u044f', 'X', 0, 0, 0, 16, 500, 379);
        add('C02', '\u0411\u043e\u043a\u043e\u0432\u0438\u043d\u0430 \u043f\u0440\u0430\u0432\u0430\u044f', 'X', 1184, 0, 0, 16, 500, 379);
        add('C03', '\u0414\u043d\u043e \u043a\u043e\u0440\u043f\u0443\u0441\u0430', 'Y', 16, 0, 0, 1168, 16, 379, c.scope === 2 ? 'circle' : '');
        add('C04', '\u041f\u0435\u0440\u0435\u0434\u043d\u044f\u044f \u0432\u0435\u0440\u0445\u043d\u044f\u044f \u0441\u0432\u044f\u0437\u044c', 'Z', 16, 440, 319, 1168, 60, 16);
        // \u0412\u0435\u0440\u0445\u043d\u0438\u0435 \u0437\u0430\u0434\u043d\u0438\u0435 \u0443\u0433\u043b\u044b \u0437\u0430\u043d\u044f\u0442\u044b Camar 807; \u0441\u0432\u044f\u0437\u0438 \u043e\u043f\u0443\u0449\u0435\u043d\u044b \u043d\u0430 120 \u043c\u043c.
        add('C05', '\u0417\u0430\u0434\u043d\u044f\u044f \u0441\u0432\u044f\u0437\u044c \u043b\u0435\u0432\u0430\u044f', 'Z', 16, 280, 0, 484, 100, 16);
        add('C06', '\u0417\u0430\u0434\u043d\u044f\u044f \u0441\u0432\u044f\u0437\u044c \u043f\u0440\u0430\u0432\u0430\u044f', 'Z', 700, 280, 0, 484, 100, 16);
        add('F01', '\u041d\u0438\u0436\u043d\u0438\u0439 \u0444\u0430\u0441\u0430\u0434', 'Z', 2, 2, 381, 1196, 246.5, 19);
        add('F02', '\u0412\u0435\u0440\u0445\u043d\u0438\u0439 \u0444\u0430\u0441\u0430\u0434', 'Z', 2, 251.5, 381, 1196, 246.5, 19);
        add('T01', '\u0421\u0442\u043e\u043b\u0435\u0448\u043d\u0438\u0446\u0430: \u0443\u0441\u043b\u043e\u0432\u043d\u044b\u0439 \u0433\u0430\u0431\u0430\u0440\u0438\u0442', 'Y', -2, 500, 0, 1204, 40, 402);
        for (var k = 0; k < c.drawerBottoms.length; k++) {
            var pre = k === 0 ? 'L' : 'U', y = c.drawerBottoms[k];
            var by = y + c.bottomRecess, top = y + c.drawerHeight;
            // \u0417\u0430\u0434\u043d\u044f\u044f \u0441\u0442\u0435\u043d\u043a\u0430 \u0438\u043c\u0435\u0435\u0442 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0439 \u043f\u0440\u043e\u0445\u043e\u0434 \u043f\u043e\u0434 \u043a\u043e\u043c\u043c\u0443\u043d\u0438\u043a\u0430\u0446\u0438\u0438.
            // \u041d\u0435\u043f\u043e\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0451\u043d\u043d\u044b\u0439 \u043a\u0440\u0438\u0432\u043e\u043b\u0438\u043d\u0435\u0439\u043d\u044b\u0439 \u0431\u043e\u0440\u0442\u0438\u043a \u043d\u0435 \u043f\u043e\u0434\u043c\u0435\u043d\u044f\u0435\u0442\u0441\u044f \u043f\u0430\u043d\u0435\u043b\u044f\u043c\u0438.
            var halfGap = c.radius;
            if (c.centerZ < c.back) halfGap = Math.sqrt(c.radius * c.radius - Math.pow(c.back - c.centerZ, 2));
            add(pre + '01', '\u0411\u043e\u043a \u044f\u0449\u0438\u043a\u0430 \u043b\u0435\u0432\u044b\u0439, NL300', 'X', c.left, y, c.back, 16, c.drawerHeight, c.drawerDepth);
            add(pre + '02', '\u0411\u043e\u043a \u044f\u0449\u0438\u043a\u0430 \u043f\u0440\u0430\u0432\u044b\u0439, NL300', 'X', c.right - 16, y, c.back, 16, c.drawerHeight, c.drawerDepth);
            add(pre + '03', '\u041f\u0435\u0440\u0435\u0434\u043d\u044f\u044f \u0441\u0442\u0435\u043d\u043a\u0430 \u044f\u0449\u0438\u043a\u0430', 'Z', c.left + 16, by, c.bottomFront, c.innerWidth, top - by, 16);
            add(pre + '04', '\u0417\u0430\u0434\u043d\u044f\u044f \u0441\u0442\u0435\u043d\u043a\u0430 \u0441\u043b\u0435\u0432\u0430', 'Z', c.left + 16, by, c.back, c.centerX - halfGap - c.left - 16, top - by, 16);
            add(pre + '05', '\u0417\u0430\u0434\u043d\u044f\u044f \u0441\u0442\u0435\u043d\u043a\u0430 \u0441\u043f\u0440\u0430\u0432\u0430', 'Z', c.centerX + halfGap, by, c.back, c.right - 16 - c.centerX - halfGap, top - by, 16);
            add(pre + '09', '\u0414\u043d\u043e \u0432\u0441\u0442\u0430\u0432\u043d\u043e\u0435, \u043e\u043a\u0440\u0443\u0433\u043b\u044b\u0439 \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0439 \u0432\u044b\u0440\u0435\u0437', 'Y', c.left + 16, by, c.bottomBack,
                c.innerWidth, 16, c.bottomFront - c.bottomBack, 'round-open');
        }
        requireValue(c.specs.length === 21, '\u041d\u0435\u043f\u043e\u043b\u043d\u044b\u0439 \u0441\u043e\u0441\u0442\u0430\u0432 \u043f\u0430\u043d\u0435\u043b\u0435\u0439.');
        c.joints = [];
        function joint(first, second, x, y, z, axis, sign) {
            // sign \u0437\u0430\u0434\u0430\u0451\u0442 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u0435\u043d\u0438\u0435 \u043e\u0442 \u0441\u0442\u044b\u043a\u0430 \u0432 \u043f\u0435\u0440\u0432\u0443\u044e \u043f\u0430\u043d\u0435\u043b\u044c (\u043f\u043b\u0430\u0441\u0442\u044c).
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
        requireValue(c.joints.length === 56, '\u041d\u0435\u043f\u043e\u043b\u043d\u0430\u044f \u0441\u0445\u0435\u043c\u0430 \u0448\u043a\u0430\u043d\u0442\u043e\u0432 \u043a\u043e\u0440\u043f\u0443\u0441\u0430 \u0438 \u043a\u043e\u0440\u043e\u0431\u043e\u0432.');
        return c;
    }

    function objects(list) {
        requireValue(list && finite(list.Count) && list.Count >= 0 && list.Objects !== undefined,
            '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u044c \u043e\u0431\u044a\u0435\u043a\u0442\u044b \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043c\u043e\u0434\u0435\u043b\u0438.');
        var a = [];
        for (var i = 0; i < list.Count; i++) {
            var o = list.Objects[i];
            requireValue(!!o, '\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u043e\u0431\u044a\u0435\u043a\u0442 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043c\u043e\u0434\u0435\u043b\u0438 ' + i);
            // \u0421\u0430\u043c \u0441\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0439 \u043a\u043e\u0440\u0435\u043d\u044c \u043d\u0435 \u044f\u0432\u043b\u044f\u0435\u0442\u0441\u044f \u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c\u0441\u043a\u0438\u043c \u043e\u0431\u044a\u0435\u043a\u0442\u043e\u043c.
            if (o !== list && o !== Model) a.push(o);
        }
        return a;
    }
    function clearCurrentModel() {
        stage = '\u043e\u0447\u0438\u0441\u0442\u043a\u0430 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043c\u043e\u0434\u0435\u043b\u0438';
        var old = objects(Model);
        changed = true;
        for (var i = old.length - 1; i >= 0; i--) DeleteObject(old[i]);
        requireValue(objects(Model).length === 0, '\u041e\u0447\u0438\u0441\u0442\u043a\u0430 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043b\u0430\u0441\u044c. \u041d\u043e\u0432\u044b\u0435 \u0434\u0435\u0442\u0430\u043b\u0438 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u0432\u0430\u043b\u0438\u0441\u044c.');
    }
    function verify(p, s) {
        var lo = p.GabMin, hi = p.GabMax;
        requireValue(lo && hi && close(lo.x, s.x) && close(lo.y, s.y + FLOOR) && close(lo.z, s.z), s.id + ': \u043d\u0435\u0432\u0435\u0440\u043d\u043e\u0435 \u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435');
        requireValue(close(hi.x - lo.x, s.w) && close(hi.y - lo.y, s.h) && close(hi.z - lo.z, s.d), s.id + ': \u043d\u0435\u0432\u0435\u0440\u043d\u044b\u0439 \u0440\u0430\u0437\u043c\u0435\u0440/\u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044f');
    }
    function localPoint(p, x, z, y) {
        var v = p.ToObject(Vector(x, y, z));
        requireValue(v && finite(v.x) && finite(v.y), '\u041e\u0448\u0438\u0431\u043a\u0430 \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0430 \u043a\u043e\u043d\u0442\u0443\u0440\u0430 \u0432 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u044b\u0435 \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u044b.');
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
        // \u041d\u043e\u0440\u043c\u0430\u043b\u044c \u0433\u043e\u0440\u0438\u0437\u043e\u043d\u0442\u0430\u043b\u044c\u043d\u043e\u0439 \u043f\u0430\u043d\u0435\u043b\u0438 \u043c\u043e\u0436\u0435\u0442 \u043c\u0435\u043d\u044f\u0442\u044c \u043e\u0440\u0438\u0435\u043d\u0442\u0430\u0446\u0438\u044e \u043e\u0431\u0445\u043e\u0434\u0430.
        var a = localPoint(p, s.x, s.z, y), b = localPoint(p, s.x + s.w, s.z, y);
        var q = localPoint(p, s.x, s.z + s.d, y);
        var reverse = (b.x - a.x) * (q.y - a.y) - (b.y - a.y) * (q.x - a.x) < 0;
        if (reverse) segments.reverse();
        p.Contour.Clear();
        for (var i = 0; i < segments.length; i++) {
            var e = segments[i];
            a = localPoint(p, (reverse ? e.b : e.a)[0], (reverse ? e.b : e.a)[1], y);
            b = localPoint(p, (reverse ? e.a : e.b)[0], (reverse ? e.a : e.b)[1], y);
            // \u0412\u043d\u0443\u0442\u0440\u0435\u043d\u043d\u044f\u044f \u0434\u0443\u0433\u0430 \u043f\u0440\u0438 \u043f\u043e\u043b\u043e\u0436\u0438\u0442\u0435\u043b\u044c\u043d\u043e\u043c \u043e\u0431\u0445\u043e\u0434\u0435 \u043d\u0430\u0440\u0443\u0436\u043d\u043e\u0433\u043e \u043a\u043e\u043d\u0442\u0443\u0440\u0430
            // \u0438\u0434\u0451\u0442 \u043f\u043e \u0447\u0430\u0441\u043e\u0432\u043e\u0439 \u0441\u0442\u0440\u0435\u043b\u043a\u0435: ArcDir=false (Script.pdf, \u0441\u0442\u0440.166).
            if (e.mid) p.Contour.AddArc(a, b, localPoint(p, c.centerX, c.centerZ, y), false);
            else p.Contour.AddLine(a.x, a.y, b.x, b.y);
        }
        requireValue(p.Contour.Count === segments.length, s.id + ': \u043d\u0435\u043f\u043e\u043b\u043d\u044b\u0439 \u043e\u043a\u0440\u0443\u0433\u043b\u044b\u0439 \u043a\u043e\u043d\u0442\u0443\u0440.');
        var removed;
        if (c.centerZ >= s.z) removed = 2 * c.radius * (c.centerZ - s.z) + Math.PI * c.radius * c.radius / 2;
        else {
            var offset = s.z - c.centerZ;
            removed = c.radius * c.radius * Math.acos(offset / c.radius) - offset * Math.sqrt(c.radius * c.radius - offset * offset);
        }
        requireValue(Math.abs(Math.abs(Geometry2D.Area(p.Contour)) - (s.w * s.d - removed)) <= 0.1,
            s.id + ': \u043d\u0435\u0432\u0435\u0440\u043d\u0430\u044f \u043f\u043b\u043e\u0449\u0430\u0434\u044c \u043e\u043a\u0440\u0443\u0433\u043b\u043e\u0433\u043e \u0432\u044b\u0440\u0435\u0437\u0430.');
    }
    function make(s, c) {
        stage = s.id + ' / ' + s.name;
        var y = s.y + FLOOR, p, thickness;
        if (s.axis === 'X') { thickness = s.w; p = AddVertPanel(s.z, y, s.z + s.d, y + s.h, s.x); }
        else if (s.axis === 'Y') { thickness = s.h; p = AddHorizPanel(s.x, s.z, s.x + s.w, s.z + s.d, y); }
        else { thickness = s.d; p = AddFrontPanel(s.x, y, s.x + s.w, y + s.h, s.z); }
        requireValue(!!p, '\u041d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0430 \u043f\u0430\u043d\u0435\u043b\u044c ' + s.id); made.push(p);
        p.Name = '\u042d\u0421\u041a\u0418\u0417 ' + s.id + ' ' + s.name; p.ArtPos = s.id;
        p.MaterialName = s.id === 'T01' ? '\u042d\u0421\u041a\u0418\u0417 \u0410\u043a\u0440\u0438\u043b: \u0433\u0430\u0431\u0430\u0440\u0438\u0442 40 \u043c\u043c' :
            (s.id === 'F01' || s.id === 'F02' ? '\u042d\u0421\u041a\u0418\u0417 \u0424\u0430\u0441\u0430\u0434 \u044d\u043c\u0430\u043b\u044c 19 \u043c\u043c' : '\u042d\u0421\u041a\u0418\u0417 \u041b\u0414\u0421\u041f 16 \u043c\u043c');
        p.Thickness = thickness; p.Build();
        var lo = p.GabMin;
        requireValue(lo && finite(lo.x) && finite(lo.y) && finite(lo.z), s.id + ': \u043d\u0435\u0442 \u0433\u0440\u0430\u043d\u0438\u0446 \u043f\u0430\u043d\u0435\u043b\u0438');
        p.PositionX += s.x - lo.x; p.PositionY += y - lo.y; p.PositionZ += s.z - lo.z;
        p.Build(); verify(p, s);
        if (s.cut === 'round-open') roundOpen(p, s, c);
        if (s.cut === 'circle') {
            var hole = NewContour(), center = localPoint(p, c.centerX, c.centerZ, y);
            hole.AddCircle(center.x, center.y, c.radius);
            // \u0412 \u043e\u043f\u0438\u0441\u0430\u043d\u0438\u0438 Script.pdf: Subtraction; \u0432 \u043f\u0440\u0438\u043c\u0435\u0440\u0435 \u0442\u043e\u0433\u043e \u0436\u0435 \u0440\u0443\u043a\u043e\u0432\u043e\u0434\u0441\u0442\u0432\u0430: Substraction.
            if (typeof p.Contour.Subtraction !== 'undefined') p.Contour.Subtraction(hole);
            else if (typeof p.Contour.Substraction !== 'undefined') p.Contour.Substraction(hole);
            else throw new Error('\u0412 \u043f\u0440\u043e\u0444\u0438\u043b\u0435 API \u043d\u0435\u0442 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u043e\u0439 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u044b\u0447\u0438\u0442\u0430\u043d\u0438\u044f \u043a\u043e\u043d\u0442\u0443\u0440\u0430.');
            requireValue(p.Contour.Count > 4, '\u041a\u0440\u0443\u0433\u043b\u044b\u0439 \u0432\u044b\u0440\u0435\u0437 \u043d\u0435 \u043f\u043e\u044f\u0432\u0438\u043b\u0441\u044f \u0432 \u043a\u043e\u043d\u0442\u0443\u0440\u0435 C03.');
        }
        p.Build(); verify(p, s);
        return p;
    }
    function mountPair(furniture, c, index) {
        stage = 'Firmax FRM0444.S30 / \u043f\u0430\u0440\u0430 ' + (index + 1);
        var before = objects(Model);
        var railY = FLOOR + c.drawerBottoms[index] + c.bottomRecess - 27;
        // \u0420\u043e\u0434\u043d\u0430\u044f \u0441\u0435\u043a\u0446\u0438\u044f \u0440\u0430\u0441\u0442\u044f\u0433\u0438\u0432\u0430\u0435\u0442 \u0440\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043c\u0435\u0436\u0434\u0443 \u0434\u0432\u0443\u043c\u044f \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0449\u0438\u043c\u0438 \u043f\u043e X.
        // \u0414\u043b\u0438\u043d\u0430 \u043d\u0430\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0449\u0438\u0445 \u0438 \u043f\u0440\u043e\u0447\u0438\u0435 \u0440\u0430\u0437\u043c\u0435\u0440\u044b \u0444\u0443\u0440\u043d\u0438\u0442\u0443\u0440\u044b \u043d\u0435 \u043c\u0430\u0441\u0448\u0442\u0430\u0431\u0438\u0440\u0443\u044e\u0442\u0441\u044f.
        furniture.MountBox(Vector(16, railY, c.runnerFront), Vector(c.opening, 0, 0),
            Vector(0, 0, 1), Vector(0, 1, 0));
        var after = objects(Model), added = [];
        for (var i = 0; i < after.length; i++) {
            var found = false;
            for (var j = 0; j < before.length; j++) if (before[j] === after[i]) found = true;
            if (!found) added.push(after[i]);
        }
        requireValue(added.length > 0, '\u0411\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u0447\u043d\u0430\u044f \u043f\u0430\u0440\u0430 \u043d\u0435 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u043b\u0430\u0441\u044c.');
        var lo = { x: Infinity, y: Infinity, z: Infinity }, hi = { x: -Infinity, y: -Infinity, z: -Infinity };
        for (i = 0; i < added.length; i++) {
            var o = added[i], mn = o.GabMin, mx = o.GabMax;
            requireValue(mn && mx, '\u041d\u0435\u0442 \u0433\u0440\u0430\u043d\u0438\u0446 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u043e\u0439 \u0444\u0443\u0440\u043d\u0438\u0442\u0443\u0440\u044b.');
            for (j = 0; j < 3; j++) {
                var axis = ['x', 'y', 'z'][j];
                requireValue(finite(mn[axis]) && finite(mx[axis]), '\u041d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u044b\u0435 \u0433\u0440\u0430\u043d\u0438\u0446\u044b \u0444\u0443\u0440\u043d\u0438\u0442\u0443\u0440\u044b.');
                lo[axis] = Math.min(lo[axis], mn[axis]); hi[axis] = Math.max(hi[axis], mx[axis]);
            }
            hardware.push(o);
        }
        // \u041f\u043e \u0433\u0435\u043e\u043c\u0435\u0442\u0440\u0438\u0438 \u0438\u0441\u0445\u043e\u0434\u043d\u043e\u0433\u043e \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u0447\u043d\u043e\u0433\u043e \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442\u0430: 300\u00d750 \u043f\u043e Z/Y,
        // \u043f\u0435\u0440\u0435\u0434\u043d\u044f\u044f \u043f\u043b\u043e\u0441\u043a\u043e\u0441\u0442\u044c Z=0, \u0437\u0430\u0434\u043d\u044f\u044f=-300; \u043f\u0430\u0440\u044b \u043d\u0430 \u0433\u0440\u0430\u043d\u044f\u0445 X=0 \u0438 X=Width.
        requireValue(close(lo.x, 16) && close(hi.x, 1184) && close(lo.z, c.runnerFront - 300) && close(hi.z, c.runnerFront),
            '\u041d\u0435 \u0441\u043e\u0432\u043f\u0430\u043b\u0438 \u043c\u043e\u043d\u0442\u0430\u0436\u043d\u044b\u0435 \u0431\u0430\u0437\u044b \u0438\u043b\u0438 \u0440\u0430\u0437\u043c\u0435\u0440 \u0441\u0435\u043a\u0446\u0438\u0438 FRM0444.S30. \u041f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0443 \u0438 \u043f\u0440\u043e\u0444\u0438\u043b\u044c API.');
        requireValue(close(lo.y, railY) && close(hi.y, railY + 50), '\u041d\u0435\u0432\u0435\u0440\u043d\u0430\u044f \u0432\u044b\u0441\u043e\u0442\u043d\u0430\u044f \u0431\u0430\u0437\u0430 FRM0444.S30.');
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
        // The native wrapper need not expose a global constructor.
        if (obj && obj.Holes && obj.Holes.List && typeof obj.DrillHoles !== 'undefined') {
            result.push(obj); return;
        }
        if (obj.List) {
            var list = obj.AsList;
            for (var i = 0; i < list.Count; i++) eachFastener(list.Objects[i], result);
        }
    }
    function setDrill(f, index, point, direction, depth, mode, diameter) {
        requireValue(f.Holes && f.Holes.Count === 2 && f.Holes.List && typeof f.DrillHoles !== 'undefined',
            '\u0428\u0430\u0431\u043b\u043e\u043d \u0448\u043a\u0430\u043d\u0442\u0430 \u0434\u043e\u043b\u0436\u0435\u043d \u0441\u043e\u0434\u0435\u0440\u0436\u0430\u0442\u044c \u0434\u0432\u0430 \u0440\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u0443\u0435\u043c\u044b\u0445 \u043e\u0442\u0432\u0435\u0440\u0441\u0442\u0438\u044f.');
        var h = f.Holes.List[index];
        h.Position = f.ToObject(point); h.Direction = f.NToObject(direction);
        h.Diameter = diameter; h.Depth = depth; h.DrillMode = mode;
        var actual = f.ToGlobal(h.Position), normal = f.NToGlobal(h.Direction);
        requireValue(close(actual.x, point.x) && close(actual.y, point.y) && close(actual.z, point.z) &&
            close(normal.x, direction.x) && close(normal.y, direction.y) && close(normal.z, direction.z) &&
            close(h.Diameter, diameter) && close(h.Depth, depth) && h.DrillMode === mode,
            '\u041f\u0440\u043e\u0444\u0438\u043b\u044c API \u043d\u0435 \u043f\u0440\u0438\u043d\u044f\u043b \u043f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b \u043f\u0440\u0438\u0441\u0430\u0434\u043a\u0438.');
    }
    function dowelBody(name, start, direction) {
        var p = AddExtrusion(name);
        p.Contour.AddCircle(0, 0, 4); p.Thickness = 30; p.MaterialName = '\u0428\u043a\u0430\u043d\u0442 \u0434\u0435\u0440\u0435\u0432\u044f\u043d\u043d\u044b\u0439 8x30, \u043d\u0430 \u043a\u043b\u0435\u044e';
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
                name + ': \u043d\u0435\u0432\u0435\u0440\u043d\u0430\u044f \u0433\u0435\u043e\u043c\u0435\u0442\u0440\u0438\u044f \u0448\u043a\u0430\u043d\u0442\u0430');
        }
        return p;
    }
    function addDowel(seed, id, p1, n1, depth1, mode1, p2, n2, depth2, start, axis) {
        var block = AddBlock(id + ' \u0428\u043a\u0430\u043d\u0442 8x30 \u043d\u0430 \u043a\u043b\u0435\u044e');
        block.IsFastener = true; block.ArtPos = id; hardware.push(block);
        var f = AddCopy(seed); f.Owner = block; f.Name = id + ' \u041f\u0440\u0438\u0441\u0430\u0434\u043a\u0430';
        setDrill(f, 0, p1, n1, depth1, mode1, 8);
        setDrill(f, 1, p2, n2, depth2, 2, 8);
        var body = dowelBody(id + ' \u0414\u0435\u0440\u0435\u0432\u044f\u043d\u043d\u044b\u0439 \u0448\u043a\u0430\u043d\u0442 8x30', start, axis); body.Owner = block;
        f.DrillHoles(); block.Build();
    }
    function mountDowels(furniture, c, panels) {
        stage = '\u0448\u043a\u0430\u043d\u0442\u044b \u043d\u0430 \u043a\u043b\u0435\u044e / \u043f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430 \u0440\u043e\u0434\u043d\u043e\u0433\u043e \u0448\u0430\u0431\u043b\u043e\u043d\u0430 \u043f\u0440\u0438\u0441\u0430\u0434\u043a\u0438';
        var before = objects(Model);
        furniture.Mount(panels.C01, panels.C03, 16, FLOOR + 8, 50);
        var temporary = addedSince(before), found = [];
        for (var i = 0; i < temporary.length; i++) eachFastener(temporary[i], found);
        requireValue(found.length === 1 && found[0].Holes.Count === 2, '\u041d\u0435 \u043f\u043e\u043b\u0443\u0447\u0435\u043d \u0448\u0430\u0431\u043b\u043e\u043d \u0434\u0432\u0443\u0445 \u043e\u0442\u0432\u0435\u0440\u0441\u0442\u0438\u0439 \u0448\u043a\u0430\u043d\u0442\u0430.');
        var seed = found[0];
        for (i = 0; i < c.joints.length; i++) {
            var j = c.joints[i], id = 'D' + (i + 1);
            stage = id + ': ' + j.first + ' / ' + j.second;
            var n = { x: 0, y: 0, z: 0 }; n[j.axis] = j.sign;
            var p = Vector(j.x, j.y + FLOOR, j.z);
            // 10+20 \u043c\u043c \u0434\u0440\u0435\u0432\u0435\u0441\u0438\u043d\u044b; \u043e\u0442\u0432\u0435\u0440\u0441\u0442\u0438\u044f 11+22 \u043c\u043c \u0441 \u0437\u0430\u043f\u0430\u0441\u043e\u043c \u043f\u043e\u0434 \u043a\u043b\u0435\u0439.
            addDowel(seed, id, p, Vector(n.x, n.y, n.z), 11, 2,
                p, Vector(-n.x, -n.y, -n.z), 22,
                Vector(p.x + 10 * n.x, p.y + 10 * n.y, p.z + 10 * n.z), Vector(-n.x, -n.y, -n.z));
        }
        for (var drawer = 0; drawer < 2; drawer++) {
            for (var row = 0; row < 2; row++) {
                for (var col = 0; col < 3; col++) {
                    var x = 100 + col * 500, y = FLOOR + c.drawerBottoms[drawer] + 55 + row * 70;
                    id = (drawer === 0 ? 'FL' : 'FU') + (row * 3 + col + 1);
                    stage = id + ': \u0448\u043a\u0430\u043d\u0442 \u043a\u0440\u0435\u043f\u043b\u0435\u043d\u0438\u044f \u0444\u0430\u0441\u0430\u0434\u0430';
                    // 16 \u043d\u0430\u0441\u043a\u0432\u043e\u0437\u044c + \u0437\u0430\u0437\u043e\u0440 2 + 12 \u0432 \u0444\u0430\u0441\u0430\u0434 = 30; \u0433\u043b\u0443\u0445\u043e\u0435 \u0441\u0432\u0435\u0440\u043b\u0435\u043d\u0438\u0435 13.
                    addDowel(seed, id, Vector(x, y, 379), Vector(0, 0, -1), 16, 1,
                        Vector(x, y, 381), Vector(0, 0, 1), 13, Vector(x, y, 363), Vector(0, 0, 1));
                }
            }
        }
        // \u0423\u0434\u0430\u043b\u044f\u0435\u0442\u0441\u044f \u0442\u043e\u043b\u044c\u043a\u043e \u0432\u0441\u043f\u043e\u043c\u043e\u0433\u0430\u0442\u0435\u043b\u044c\u043d\u044b\u0439 \u044d\u043a\u0437\u0435\u043c\u043f\u043b\u044f\u0440, \u0435\u0433\u043e \u043a\u043e\u043f\u0438\u0438 \u0443\u0436\u0435 \u0441\u0430\u043c\u043e\u0441\u0442\u043e\u044f\u0442\u0435\u043b\u044c\u043d\u044b.
        for (i = temporary.length - 1; i >= 0; i--) DeleteObject(temporary[i]);
    }
    function mountHangers(furniture, c) {
        stage = 'Camar 807 / \u043f\u0430\u0440\u0430 \u043f\u043e\u0434\u0432\u0435\u0441\u043e\u0432 \u0441 \u043f\u043b\u0430\u043d\u043a\u0430\u043c\u0438 \u0438 \u0437\u0430\u0433\u043b\u0443\u0448\u043a\u0430\u043c\u0438';
        var before = objects(Model);
        // \u0420\u043e\u0434\u043d\u0430\u044f \u0440\u0430\u043c\u043a\u0430 150x100x0 \u0441 \u043d\u0438\u0436\u043d\u0435\u0439 \u0431\u0430\u0437\u043e\u0439 Y=-100; \u0435\u0451 \u0432\u0435\u0440\u0445 \u0441\u043e\u0432\u043c\u0435\u0449\u0451\u043d \u0441 Y=500.
        furniture.MountBox(Vector(16, FLOOR + 400, 0), Vector(c.opening, 100, 0), Vector(0, 0, 1), Vector(0, 1, 0));
        var added = addedSince(before);
        requireValue(added.length > 0, '\u0421\u0435\u043a\u0446\u0438\u044f Camar 807 \u043d\u0435 \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u043b\u0430\u0441\u044c.');
        for (var i = 0; i < added.length; i++) hardware.push(added[i]);
        // \u041e\u0431\u0449\u0438\u0439 AABB \u0441\u043e\u0434\u0435\u0440\u0436\u0438\u0442 \u0441\u043b\u0443\u0436\u0435\u0431\u043d\u044b\u0435 \u0442\u0440\u0430\u0435\u043a\u0442\u043e\u0440\u0438\u0438 \u0432\u044b\u0440\u0435\u0437\u043e\u0432 \u0438\u0437 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0438;
        // \u0440\u0435\u0430\u043b\u044c\u043d\u044b\u0435 \u043c\u0435\u0445\u0430\u043d\u0438\u0437\u043c\u044b/\u043f\u043b\u0430\u043d\u043a\u0438/\u0437\u0430\u0433\u043b\u0443\u0448\u043a\u0438 \u0438\u0437\u043c\u0435\u0440\u044f\u044e\u0442\u0441\u044f \u043e\u0442\u0434\u0435\u043b\u044c\u043d\u043e \u0432 \u0411\u0410\u0417\u0418\u0421 \u043f\u043e run.md.
    }
    try {
        requireValue(typeof Model !== 'undefined' && !!Model, '\u041d\u0435\u0442 \u0442\u0435\u043a\u0443\u0449\u0435\u0433\u043e \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442\u0430 \u0411\u0410\u0417\u0418\u0421.');
        var required = [
            ['AddVertPanel', typeof AddVertPanel !== 'undefined'],
            ['AddHorizPanel', typeof AddHorizPanel !== 'undefined'],
            ['AddFrontPanel', typeof AddFrontPanel !== 'undefined'],
            ['Vector', typeof Vector !== 'undefined'],
            ['DeleteObject', typeof DeleteObject !== 'undefined'],
            ['OpenFurniture', typeof OpenFurniture !== 'undefined'],
            ['NewContour', typeof NewContour !== 'undefined'],
            ['prompt', typeof prompt !== 'undefined'],
            ['DatumMode.Box', typeof DatumMode !== 'undefined' && typeof DatumMode.Box !== 'undefined'],
            ['DatumMode.FaceFace', typeof DatumMode !== 'undefined' && typeof DatumMode.FaceFace !== 'undefined'],
            ['Geometry2D.Area', typeof Geometry2D !== 'undefined' && typeof Geometry2D.Area !== 'undefined'],
            ['AddBlock', typeof AddBlock !== 'undefined'],
            ['AddCopy', typeof AddCopy !== 'undefined'],
            ['AddExtrusion', typeof AddExtrusion !== 'undefined']
        ], missing = [];
        for (var apiIndex = 0; apiIndex < required.length; apiIndex++) if (!required[apiIndex][1]) missing.push(required[apiIndex][0]);
        requireValue(missing.length === 0, '\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u0442\u0440\u0435\u0431\u0443\u0435\u043c\u044b\u0439 \u0433\u043b\u043e\u0431\u0430\u043b\u044c\u043d\u044b\u0439 API: ' + missing.join(', ') +
            '. \u0410\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u043e\u0435 \u043f\u0435\u0440\u0435\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u0435 \u0432\u0435\u0440\u0441\u0438\u0438 \u043d\u0435 \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u0435\u0442\u0441\u044f.');
        objects(Model);
        stage = '\u0432\u0432\u043e\u0434 \u0440\u0430\u0437\u043c\u0435\u0440\u043e\u0432 \u0432\u044b\u0440\u0435\u0437\u0430';
        var input = {};
        input.scope = askNumber('\u0412\u044b\u0440\u0435\u0437 \u043f\u043e \u0446\u0435\u043d\u0442\u0440\u0443: 1 \u2014 \u043e\u043a\u0440\u0443\u0433\u043b\u044b\u0439, \u043e\u0442\u043a\u0440\u044b\u0442\u044b\u0439 \u043d\u0430\u0437\u0430\u0434 \u0432 \u043e\u0431\u043e\u0438\u0445 \u044f\u0449\u0438\u043a\u0430\u0445; 2 \u2014 \u0442\u043e \u0436\u0435 \u0438 \u043a\u0440\u0443\u0433\u043b\u044b\u0439 \u0432 \u0434\u043d\u0435 \u043a\u043e\u0440\u043f\u0443\u0441\u0430. \u0417\u0430\u043c\u043a\u043d\u0443\u0442\u044b\u0439 \u043a\u0440\u0443\u0433 \u0432\u043e\u043a\u0440\u0443\u0433 \u0442\u0440\u0443\u0431\u044b \u0431\u043b\u043e\u043a\u0438\u0440\u0443\u0435\u0442 \u0434\u0432\u0438\u0436\u0435\u043d\u0438\u0435 \u044f\u0449\u0438\u043a\u0430. \u0412\u0432\u0435\u0434\u0438\u0442\u0435 1 \u0438\u043b\u0438 2; \u043e\u0442\u043c\u0435\u043d\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442 \u043c\u043e\u0434\u0435\u043b\u044c.');
        input.centerZ = askNumber('\u0420\u0430\u0441\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u043e\u0442 \u0441\u0442\u0435\u043d\u044b \u0414\u041e \u0426\u0415\u041d\u0422\u0420\u0410 \u0432\u044b\u0440\u0435\u0437\u0430, \u043c\u043c. \u0423\u043a\u0430\u0437\u0430\u043d\u043d\u044b\u0435 100 \u043c\u043c \u0440\u0430\u043d\u0435\u0435 \u043e\u0431\u043e\u0437\u043d\u0430\u0447\u0430\u043b\u0438 \u0432\u044b\u0441\u0442\u0443\u043f \u043a\u0430\u043d\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u0438; \u0432\u0432\u0435\u0434\u0438\u0442\u0435 100 \u0442\u043e\u043b\u044c\u043a\u043e \u0435\u0441\u043b\u0438 \u044d\u0442\u043e \u0442\u0430\u043a\u0436\u0435 \u043a\u043e\u043e\u0440\u0434\u0438\u043d\u0430\u0442\u0430 \u0446\u0435\u043d\u0442\u0440\u0430 \u0441\u0438\u0444\u043e\u043d\u0430.');
        input.diameter = askNumber('\u0414\u0438\u0430\u043c\u0435\u0442\u0440 \u043e\u043a\u0440\u0443\u0433\u043b\u043e\u0433\u043e \u0432\u044b\u0440\u0435\u0437\u0430, \u043c\u043c, \u0441 \u0443\u0447\u0451\u0442\u043e\u043c \u0440\u0430\u0441\u0442\u0440\u0443\u0431\u0430/\u0441\u0438\u0444\u043e\u043d\u0430 \u0438 \u043c\u043e\u043d\u0442\u0430\u0436\u043d\u043e\u0433\u043e \u0437\u0430\u0437\u043e\u0440\u0430.');
        var c = calculate(input);
        stage = '\u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0430 \u0431\u0438\u0431\u043b\u0438\u043e\u0442\u0435\u043a\u0438 Firmax';
        var furniture = OpenFurniture(LIBRARY);
        requireValue(furniture && furniture.DatumMode === DatumMode.Box && typeof furniture.MountBox !== 'undefined',
            '\u041d\u0443\u0436\u0435\u043d \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u043d\u044b\u0439 \u0441\u0435\u043a\u0446\u0438\u043e\u043d\u043d\u044b\u0439 \u0444\u0440\u0430\u0433\u043c\u0435\u043d\u0442 lib/FRM0444.S30.fr3d. \u041e\u043d \u0434\u043e\u043b\u0436\u0435\u043d \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0442\u044c\u0441\u044f \u0432 \u044d\u0442\u043e\u0439 \u0441\u0431\u043e\u0440\u043a\u0435 \u0411\u0410\u0417\u0418\u0421.');
        var dowels = OpenFurniture(DOWEL_LIBRARY), hangers = OpenFurniture(HANGER_LIBRARY);
        requireValue(dowels && dowels.DatumMode === DatumMode.FaceFace && typeof dowels.Mount !== 'undefined',
            '\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u043d\u044b\u0439 \u0448\u0430\u0431\u043b\u043e\u043d \u0448\u043a\u0430\u043d\u0442\u0430 8x30.');
        requireValue(hangers && hangers.DatumMode === DatumMode.Box && typeof hangers.MountBox !== 'undefined',
            '\u041d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u0435\u043d \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u043d\u044b\u0439 \u043a\u043e\u043c\u043f\u043b\u0435\u043a\u0442 Camar 807.');
        clearCurrentModel();
        var panels = {};
        for (var i = 0; i < c.specs.length; i++) panels[c.specs[i].id] = make(c.specs[i], c);
        mountPair(furniture, c, 0); mountPair(furniture, c, 1);
        mountHangers(hangers, c); mountDowels(dowels, c, panels);
        for (i = 0; i < c.specs.length; i++) verify(made[i], c.specs[i]);
        requireValue(objects(Model).length === made.length + hardware.length, '\u041d\u0435 \u0441\u043e\u0432\u043f\u0430\u043b \u0441\u043e\u0441\u0442\u0430\u0432 \u0442\u0435\u043a\u0443\u0449\u0435\u0439 \u043c\u043e\u0434\u0435\u043b\u0438.');
        alert('\u042d\u0421\u041a\u0418\u0417 vanity-1200, \u0440\u0435\u0432\u0438\u0437\u0438\u044f ' + REV + '.\n\u0421\u043e\u0437\u0434\u0430\u043d\u043e 21 \u043f\u0430\u043d\u0435\u043b\u044c (\u0432\u043a\u043b\u044e\u0447\u0430\u044f 2 \u0444\u0430\u0441\u0430\u0434\u0430), 2 \u043f\u0430\u0440\u044b Firmax FRM0444.S30, Camar 807 \u0438 68 \u0448\u043a\u0430\u043d\u0442\u043e\u0432 \u043d\u0430 \u043a\u043b\u0435\u044e.\n' +
            '\u041d\u0430\u043f\u0440\u0430\u0432\u043b\u044f\u044e\u0449\u0438\u0435 300 \u043c\u043c; \u043a\u043e\u0440\u043e\u0431\u0430 1158 x 290 \u043c\u043c. \u0412\u044b\u0440\u0435\u0437 \u043f\u043e X=600, Z=' + c.centerZ + ', \u0434\u0438\u0430\u043c\u0435\u0442\u0440 ' + input.diameter + '.\n' +
            '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u0435 \u043c\u043e\u0434\u0435\u043b\u044c \u043f\u043e\u0434 \u043d\u043e\u0432\u044b\u043c \u0438\u043c\u0435\u043d\u0435\u043c \u0438 \u043f\u0440\u043e\u0432\u0435\u0440\u044c\u0442\u0435 \u043f\u043e run.md.\n\u0410\u043d\u043a\u0435\u0440\u044b \u0441\u0442\u0435\u043d\u044b, \u0442\u0435\u0445\u043d\u043e\u043b\u043e\u0433\u0438\u044f \u043a\u043b\u0435\u044f, \u0437\u0430\u0449\u0438\u0442\u0430 \u0432\u044b\u0440\u0435\u0437\u0430, \u043a\u0440\u043e\u043c\u043a\u0438, \u043f\u0440\u0438\u0441\u0430\u0434\u043a\u0430 \u0438 \u043f\u0440\u043e\u0447\u043d\u043e\u0441\u0442\u044c \u0442\u0440\u0435\u0431\u0443\u044e\u0442 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0438.');
    } catch (e) {
        alert((e.cancelled ? '\u0412\u0432\u043e\u0434 \u043e\u0442\u043c\u0435\u043d\u0451\u043d.' : '\u041f\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435 \u043e\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e: ' + stage + '\n' + String(e)) +
            (changed ? '\n\u0422\u0435\u043a\u0443\u0449\u0430\u044f \u043c\u043e\u0434\u0435\u043b\u044c \u0443\u0436\u0435 \u0438\u0437\u043c\u0435\u043d\u0435\u043d\u0430; \u0440\u0435\u0437\u0443\u043b\u044c\u0442\u0430\u0442 \u043d\u0435 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043d. \u041f\u0430\u043d\u0435\u043b\u0435\u0439: ' + made.length + '. \u0421\u043b\u0435\u0434\u0443\u044e\u0449\u0438\u0439 \u0437\u0430\u043f\u0443\u0441\u043a \u0441\u043d\u043e\u0432\u0430 \u043e\u0447\u0438\u0441\u0442\u0438\u0442 \u0435\u0451.' : '\n\u041e\u0447\u0438\u0441\u0442\u043a\u0430 \u0438 \u043f\u043e\u0441\u0442\u0440\u043e\u0435\u043d\u0438\u0435 \u043d\u0435 \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u043b\u0438\u0441\u044c.') +
            '\n\u0420\u0435\u0432\u0438\u0437\u0438\u044f ' + REV + '.');
    }
})();
