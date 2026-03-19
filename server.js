const express = require("express");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const ADMIN_KEY = "admin-secret-123";
const keys = {};

function genKey() {
  const a = Math.random().toString(36).slice(2, 6).toUpperCase();
  const b = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ATH-${a}-${b}`;
}

function formatVNTime(ms) {
  return new Date(ms).toLocaleString("vi-VN");
}

function isAdmin(req) {
  return req.query.admin === ADMIN_KEY;
}

app.post("/api/create", (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Sai admin key" });
  }

  const customKey = String(req.body.key || "").trim();
  const uses = Math.max(1, Number(req.body.uses || 50));
  const days = Math.max(1, Number(req.body.days || 30));
  const key = customKey || genKey();
  const expireAt = Date.now() + days * 24 * 60 * 60 * 1000;

  keys[key] = {
    uses,
    expireAt,
    device: null,
    createdAt: Date.now()
  };

  return res.json({
    ok: true,
    key,
    uses,
    expireAt,
    expireText: formatVNTime(expireAt)
  });
});

app.post("/api/check", (req, res) => {
  const key = String(req.body.key || "").trim();
  const device = String(req.body.device || "").trim();

  if (!key || !device) {
    return res.json({ ok: false, msg: "Thiếu key hoặc thiết bị" });
  }

  const item = keys[key];
  if (!item) {
    return res.json({ ok: false, msg: "Key không tồn tại" });
  }

  if (Date.now() >= item.expireAt) {
    return res.json({ ok: false, msg: "Key đã hết hạn" });
  }

  if (item.device && item.device !== device) {
    return res.json({ ok: false, msg: "Key đã được dùng trên thiết bị khác" });
  }

  if (item.uses <= 0) {
    return res.json({ ok: false, msg: "Key đã hết lượt đăng nhập" });
  }

  if (!item.device) {
    item.device = device;
  }

  item.uses -= 1;

  return res.json({
    ok: true,
    msg: "Đăng nhập thành công",
    key,
    usesLeft: item.uses,
    expireAt: item.expireAt,
    expireText: formatVNTime(item.expireAt)
  });
});

app.post("/api/status", (req, res) => {
  const key = String(req.body.key || "").trim();
  const device = String(req.body.device || "").trim();

  const item = keys[key];
  if (!item) {
    return res.json({ ok: false, msg: "Key không tồn tại" });
  }

  if (item.device && item.device !== device) {
    return res.json({ ok: false, msg: "Key đã đổi thiết bị" });
  }

  if (Date.now() >= item.expireAt) {
    return res.json({ ok: false, msg: "Key đã hết hạn" });
  }

  return res.json({
    ok: true,
    key,
    usesLeft: item.uses,
    expireAt: item.expireAt,
    expireText: formatVNTime(item.expireAt),
    now: Date.now()
  });
});

app.get("/api/list", (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Sai admin key" });
  }
  return res.json(keys);
});

app.post("/api/delete", (req, res) => {
  if (!isAdmin(req)) {
    return res.status(401).json({ ok: false, error: "Sai admin key" });
  }

  const key = String(req.body.key || "").trim();
  if (!keys[key]) {
    return res.json({ ok: false, error: "Không tìm thấy key" });
  }

  delete keys[key];
  return res.json({ ok: true, msg: "Đã xóa key" });
});

app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AimTrickHead</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #07090f;
      color: white;
      font-family: Arial, sans-serif;
      padding: 20px;
    }
    .box {
      width: min(92vw, 430px);
      padding: 24px;
      border-radius: 24px;
      background: rgba(255,255,255,.04);
      border: 1px solid rgba(0,255,255,.2);
      box-shadow: 0 0 30px rgba(0,255,255,.12);
      text-align: center;
    }
    h1 { color: #9ff; margin-top: 0; }
    a {
      display: block;
      margin: 12px 0;
      padding: 14px;
      border-radius: 14px;
      text-decoration: none;
      color: white;
      background: linear-gradient(90deg,#00cfff,#8b00ff,#ff0077);
    }
  </style>
</head>
<body>
  <div class="box">
    <h1>AimTrickHead</h1>
    <p>Server đang hoạt động</p>
    <a href="/panel">Vào Panel</a>
    <a href="/admin">Vào Admin</a>
  </div>
</body>
</html>
  `);
});

app.get("/panel", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Panel VIP</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      color: white;
      background:
        radial-gradient(circle at 18% 18%, rgba(0,255,255,.16), transparent 25%),
        radial-gradient(circle at 82% 18%, rgba(255,0,140,.18), transparent 25%),
        radial-gradient(circle at 50% 100%, rgba(0,120,255,.18), transparent 30%),
        #05060a;
    }
    .wrap {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      width: min(92vw, 460px);
      border-radius: 28px;
      background: rgba(10,12,18,.84);
      border: 1px solid rgba(0,255,255,.2);
      box-shadow: 0 0 35px rgba(0,255,255,.10), 0 0 70px rgba(255,0,140,.08);
      overflow: hidden;
    }
    .top { padding: 22px 20px 14px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .title { margin: 0; font-size: 28px; color: #9ff; }
    .sub { margin: 8px 0 0; color: #aab6cf; font-size: 13px; }
    .content { padding: 18px; }
    .input {
      width: 100%;
      height: 54px;
      border: none;
      outline: none;
      border-radius: 16px;
      padding: 0 14px;
      color: white;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.08);
      font-size: 15px;
    }
    .btn, .btn2 {
      width: 100%;
      height: 50px;
      margin-top: 12px;
      border: none;
      border-radius: 14px;
      color: white;
      font-weight: 700;
      cursor: pointer;
    }
    .btn { background: linear-gradient(90deg,#00cfff,#8b00ff,#ff0077); }
    .btn2 { background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.08); }
    .msg { min-height: 22px; margin-top: 12px; text-align: center; font-size: 14px; }
    .hidden { display: none !important; }
    .headrow { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
    .info {
      padding: 12px;
      border-radius: 16px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.08);
      margin-bottom: 14px;
      line-height: 1.7;
      font-size: 13px;
    }
    .countdown { margin-top: 8px; font-weight: 700; color: #9ff; font-size: 15px; }
    .feature {
      padding: 16px;
      border-radius: 18px;
      margin-bottom: 12px;
      background: rgba(255,255,255,.05);
      border: 1px solid rgba(255,255,255,.08);
    }
    .row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .name { margin: 0; font-size: 16px; }
    .desc { margin: 6px 0 0; color: #9fb0c8; font-size: 12px; }
    .switch { position: relative; width: 58px; height: 32px; flex: 0 0 58px; }
    .switch input { display: none; }
    .slider {
      position: absolute; inset: 0; border-radius: 999px;
      background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.1);
      transition: .25s; cursor: pointer;
    }
    .slider:before {
      content: ""; position: absolute; width: 24px; height: 24px; left: 4px; top: 3px;
      border-radius: 50%; background: white; transition: .25s;
    }
    .switch input:checked + .slider {
      background: linear-gradient(90deg,#00d9ff,#9900ff);
    }
    .switch input:checked + .slider:before { transform: translateX(25px); }
    .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="top">
        <h1 class="title">AimTrickHead VIP</h1>
        <p class="sub">Đăng nhập bằng key để vào bảng điều khiển</p>
      </div>
      <div class="content">
        <div id="loginView">
          <input id="keyInput" class="input" placeholder="Nhập key của bạn">
          <button class="btn" onclick="dangNhap()">Đăng nhập</button>
          <button class="btn2" onclick="window.open('https://zalo.me/0818249250','_blank')">Mua key qua Zalo</button>
          <div id="msg" class="msg"></div>
        </div>

        <div id="panelView" class="hidden">
          <div class="headrow">
            <h2>Bảng Điều Khiển VIP</h2>
            <button class="btn2" style="width:auto;padding:0 14px" onclick="dangXuat()">Thoát</button>
          </div>

          <div class="info">
            <div><b>Key:</b> <span id="keyText"></span></div>
            <div><b>Thiết bị:</b> <span id="deviceText"></span></div>
            <div><b>Hết hạn lúc:</b> <span id="expireText"></span></div>
            <div><b>Lượt còn:</b> <span id="usesText">--</span></div>
            <div class="countdown">Còn lại: <span id="timeLeft">--:--:--</span></div>
          </div>

          <div class="feature">
            <div class="row">
              <div><p class="name">Giảm Tình Trạng Rung Tâm</p><p class="desc">Giao diện trạng thái 1.</p></div>
              <label class="switch"><input type="checkbox" id="f1" onchange="luuTrangThai()"><span class="slider"></span></label>
            </div>
          </div>

          <div class="feature">
            <div class="row">
              <div><p class="name">AimTrickHead</p><p class="desc">Giao diện trạng thái 2.</p></div>
              <label class="switch"><input type="checkbox" id="f2" onchange="luuTrangThai()"><span class="slider"></span></label>
            </div>
          </div>

          <div class="feature">
            <div class="row">
              <div><p class="name">Bám Đầu</p><p class="desc">Giao diện trạng thái 3.</p></div>
              <label class="switch"><input type="checkbox" id="f3" onchange="luuTrangThai()"><span class="slider"></span></label>
            </div>
          </div>

          <div class="feature">
            <div class="row">
              <div><p class="name">Nhẹ Tâm</p><p class="desc">Giao diện trạng thái 4.</p></div>
              <label class="switch"><input type="checkbox" id="f4" onchange="luuTrangThai()"><span class="slider"></span></label>
            </div>
          </div>

          <div class="actions">
            <button class="btn2" onclick="window.open('https://ff.garena.com/vn/','_blank')">Mở/Tải Free Fire</button>
            <button class="btn2" onclick="window.open('https://ff.garena.com/vn/','_blank')">Mở/Tải FF MAX</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const msg = document.getElementById("msg");
    const loginView = document.getElementById("loginView");
    const panelView = document.getElementById("panelView");
    const keyText = document.getElementById("keyText");
    const deviceText = document.getElementById("deviceText");
    const expireText = document.getElementById("expireText");
    const usesText = document.getElementById("usesText");
    const timeLeft = document.getElementById("timeLeft");

    let expireAt = 0;
    let countdownTimer = null;
    let statusTimer = null;

    function getDevice() {
      let id = localStorage.getItem("ath_device");
      if (!id) {
        id = "ios-" + Math.random().toString(36).slice(2, 12);
        localStorage.setItem("ath_device", id);
      }
      return id;
    }

    function setMsg(text, type) {
      msg.textContent = text || "";
      msg.style.color = type === "err" ? "#ff6f93" : type === "ok" ? "#67ffb7" : "#fff";
    }

    function saveSession(key) { localStorage.setItem("ath_key", key); }
    function getSession() { return localStorage.getItem("ath_key"); }
    function clearSession() { localStorage.removeItem("ath_key"); }

    function formatLeft(ms) {
      if (ms <= 0) return "00:00:00";
      const s = Math.floor(ms / 1000);
      const h = String(Math.floor(s / 3600)).padStart(2, "0");
      const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
      const sec = String(s % 60).padStart(2, "0");
      return h + ":" + m + ":" + sec;
    }

    function batDemNguoc() {
      clearInterval(countdownTimer);
      countdownTimer = setInterval(() => {
        const left = expireAt - Date.now();
        timeLeft.textContent = formatLeft(left);
        if (left <= 0) dangXuat(true);
      }, 1000);
    }

    async function kiemTraNen() {
      const key = getSession();
      if (!key) return;
      try {
        const res = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, device: getDevice() })
        });
        const data = await res.json();
        if (!data.ok) {
          dangXuat(true);
          return;
        }
        expireAt = data.expireAt;
        expireText.textContent = data.expireText || "--";
        usesText.textContent = data.usesLeft ?? "--";
      } catch {}
    }

    function moPanel(key, data) {
      loginView.classList.add("hidden");
      panelView.classList.remove("hidden");
      keyText.textContent = key;
      deviceText.textContent = getDevice();
      expireText.textContent = data.expireText || "--";
      usesText.textContent = data.usesLeft ?? "--";
      expireAt = data.expireAt || 0;
      taiTrangThai();
      batDemNguoc();
      clearInterval(statusTimer);
      statusTimer = setInterval(kiemTraNen, 15000);
    }

    function dangXuat(expired = false) {
      clearSession();
      clearInterval(countdownTimer);
      clearInterval(statusTimer);
      panelView.classList.add("hidden");
      loginView.classList.remove("hidden");
      document.getElementById("keyInput").value = "";
      setMsg(expired ? "Key đã hết hạn hoặc bị khóa. Vui lòng đăng nhập lại." : "", expired ? "err" : "");
    }

    async function dangNhap() {
      const key = document.getElementById("keyInput").value.trim();
      if (!key) {
        setMsg("Vui lòng nhập key.", "err");
        return;
      }
      setMsg("Đang kiểm tra key...");
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, device: getDevice() })
        });
        const data = await res.json();
        if (!data.ok) {
          setMsg(data.msg || "Đăng nhập thất bại.", "err");
          return;
        }
        saveSession(key);
        setMsg("Đăng nhập thành công.", "ok");
        moPanel(key, data);
      } catch {
        setMsg("Không thể kết nối tới máy chủ.", "err");
      }
    }

    function luuTrangThai() {
      const state = {
        f1: document.getElementById("f1").checked,
        f2: document.getElementById("f2").checked,
        f3: document.getElementById("f3").checked,
        f4: document.getElementById("f4").checked
      };
      localStorage.setItem("ath_state", JSON.stringify(state));
    }

    function taiTrangThai() {
      try {
        const state = JSON.parse(localStorage.getItem("ath_state") || "{}");
        document.getElementById("f1").checked = !!state.f1;
        document.getElementById("f2").checked = !!state.f2;
        document.getElementById("f3").checked = !!state.f3;
        document.getElementById("f4").checked = !!state.f4;
      } catch {}
    }

    window.addEventListener("load", async () => {
      const key = getSession();
      if (!key) return;
      try {
        const res = await fetch("/api/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key, device: getDevice() })
        });
        const data = await res.json();
        if (data.ok) moPanel(key, data);
        else clearSession();
      } catch {}
    });
  </script>
</body>
</html>
  `);
});

app.get("/admin", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin</title>
  <style>
    body { margin:0; min-height:100vh; background:#06070b; color:white; font-family:Arial,sans-serif; padding:20px; }
    .wrap { max-width:700px; margin:0 auto; }
    .box { padding:20px; border-radius:20px; background:rgba(255,255,255,.04); border:1px solid rgba(0,255,255,.2); }
    input,button { width:100%; height:48px; border:none; border-radius:12px; margin-top:10px; padding:0 12px; box-sizing:border-box; }
    input { background:rgba(255,255,255,.06); color:white; }
    button { background:linear-gradient(90deg,#00cfff,#8b00ff,#ff0077); color:white; font-weight:700; }
    .item { margin-top:10px; padding:12px; border-radius:14px; background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08); }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="box">
      <h1>Admin Tạo Key</h1>
      <input id="adminKey" type="password" placeholder="Admin Key">
      <input id="customKey" placeholder="Key muốn tạo (để trống = tự random)">
      <input id="uses" type="number" value="50" placeholder="Số lượt dùng">
      <input id="days" type="number" value="30" placeholder="Số ngày sử dụng">
      <button onclick="taoKey()">Tạo Key</button>
      <button onclick="taiDanhSach()">Tải danh sách key</button>
      <div id="result"></div>
      <div id="list"></div>
    </div>
  </div>

  <script>
    async function taoKey() {
      const adminKey = document.getElementById("adminKey").value.trim();
      const customKey = document.getElementById("customKey").value.trim();
      const uses = Number(document.getElementById("uses").value || 50);
      const days = Number(document.getElementById("days").value || 30);
      const result = document.getElementById("result");

      result.innerHTML = "Đang tạo key...";

      try {
        const res = await fetch("/api/create?admin=" + encodeURIComponent(adminKey), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: customKey, uses, days })
        });

        const data = await res.json();

        if (!data.ok) {
          result.innerHTML = '<span style="color:#ff6f93">⛔ ' + (data.error || "Tạo key thất bại") + '</span>';
          return;
        }

        result.innerHTML =
          '<span style="color:#67ffb7">✅ Tạo thành công</span><br>' +
          '🔑 Key: <b>' + data.key + '</b><br>' +
          '🔢 Số lượt: ' + data.uses + '<br>' +
          '⏳ Hết hạn: ' + data.expireText;

        taiDanhSach();
      } catch (e) {
        result.innerHTML = '<span style="color:#ff6f93">❌ Lỗi mạng</span>';
      }
    }

    async function taiDanhSach() {
      const adminKey = document.getElementById("adminKey").value.trim();
      const box = document.getElementById("list");
      box.innerHTML = "Đang tải...";

      try {
        const res = await fetch("/api/list?admin=" + encodeURIComponent(adminKey));
        const data = await res.json();

        if (data.ok === false && data.error) {
          box.innerHTML = '<span style="color:#ff6f93">⛔ ' + data.error + '</span>';
          return;
        }

        const entries = Object.entries(data);
        if (!entries.length) {
          box.innerHTML = "Chưa có key nào.";
          return;
        }

        box.innerHTML = entries.map(([k, v]) => \`
          <div class="item">
            <div><b>Key:</b> \${k}</div>
            <div><b>Lượt còn:</b> \${v.uses}</div>
            <div><b>Thiết bị:</b> \${v.device || "Chưa khóa"}</div>
            <div><b>Hết hạn:</b> \${new Date(v.expireAt).toLocaleString("vi-VN")}</div>
            <button style="margin-top:8px;background:#7a1734" onclick="xoaKey('\${k}')">Xóa key</button>
          </div>
        \`).join("");
      } catch (e) {
        box.innerHTML = '<span style="color:#ff6f93">❌ Lỗi mạng</span>';
      }
    }

    async function xoaKey(key) {
      const adminKey = document.getElementById("adminKey").value.trim();
      await fetch("/api/delete?admin=" + encodeURIComponent(adminKey), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key })
      });
      taiDanhSach();
    }
  </script>
</body>
</html>
  `);
});

app.listen(PORT, () => {
  console.log("Server chạy tại port " + PORT);
});
