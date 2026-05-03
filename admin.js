let state = null;
let pin = localStorage.getItem("dermalab_admin_pin") || "";

const contentForm = document.querySelector(".content-form");
const loginForm = document.querySelector(".login-form");
const saveStatus = document.querySelector(".save-status");
const resourceList = document.querySelector(".resource-list");
const leadTable = document.querySelector(".lead-table");

function setStatus(message) {
  saveStatus.textContent = message;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}

function renderResources() {
  resourceList.innerHTML = "";
  state.resources.forEach((resource, index) => {
    const row = document.createElement("div");
    row.className = "resource-row";
    row.innerHTML = `
      <label>资料名称<input data-resource-title="${index}" value="${resource.title || ""}"></label>
      <label>链接地址<input data-resource-url="${index}" value="${resource.url || ""}"></label>
      <button type="button" data-remove-resource="${index}">删除</button>
    `;
    resourceList.append(row);
  });
}

function fillForm() {
  contentForm.brandName.value = state.brandName || "";
  contentForm.heroEyebrowZh.value = state.hero.zh.eyebrow || "";
  contentForm.heroTitleZh.value = state.hero.zh.title || "";
  contentForm.heroTextZh.value = state.hero.zh.text || "";
  contentForm.heroEyebrowEn.value = state.hero.en.eyebrow || "";
  contentForm.heroTitleEn.value = state.hero.en.title || "";
  contentForm.heroTextEn.value = state.hero.en.text || "";
  contentForm.wechatTitle.value = state.wechat.title || "";
  contentForm.wechatQrText.value = state.wechat.qrText || "";
  contentForm.wechatNote.value = state.wechat.note || "";
  renderResources();
  document.querySelector("#metric-resources").textContent = state.resources.length;
}

function collectForm() {
  state.brandName = contentForm.brandName.value.trim();
  state.hero.zh.eyebrow = contentForm.heroEyebrowZh.value.trim();
  state.hero.zh.title = contentForm.heroTitleZh.value.trim();
  state.hero.zh.text = contentForm.heroTextZh.value.trim();
  state.hero.en.eyebrow = contentForm.heroEyebrowEn.value.trim();
  state.hero.en.title = contentForm.heroTitleEn.value.trim();
  state.hero.en.text = contentForm.heroTextEn.value.trim();
  state.wechat.title = contentForm.wechatTitle.value.trim();
  state.wechat.qrText = contentForm.wechatQrText.value.trim();
  state.wechat.note = contentForm.wechatNote.value.trim();
  state.resources = [...resourceList.querySelectorAll(".resource-row")].map((row) => ({
    title: row.querySelector("[data-resource-title]").value.trim(),
    url: row.querySelector("[data-resource-url]").value.trim()
  }));
  return state;
}

async function loadContent() {
  state = await requestJson("/api/site-content");
  fillForm();
  document.querySelector("#metric-status").textContent = pin ? "Unlocked" : "Locked";
}

async function loadLeads() {
  const leads = await requestJson("/api/leads");
  document.querySelector("#metric-leads").textContent = leads.length;
  leadTable.innerHTML = leads.length
    ? ""
    : "<p>暂无线索。前台提交预约后会出现在这里。</p>";
  leads.forEach((lead) => {
    const row = document.createElement("article");
    row.className = "lead-row";
    row.innerHTML = `
      <div><strong>${lead.name}</strong><span>${new Date(lead.createdAt).toLocaleString()}</span></div>
      <div><strong>${lead.contact}</strong><span>联系方式</span></div>
      <div><strong>${lead.need || "-"}</strong><span>需求类型</span></div>
      <div><strong>${lead.message || "-"}</strong><span>补充说明</span></div>
    `;
    leadTable.append(row);
  });
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pin = loginForm.pin.value.trim();
  localStorage.setItem("dermalab_admin_pin", pin);
  document.querySelector("#metric-status").textContent = "Unlocked";
  setStatus("已登录，可以保存配置。");
});

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!pin) {
    setStatus("请先输入管理 PIN。");
    return;
  }
  try {
    const content = collectForm();
    state = await requestJson("/api/site-content", {
      method: "PUT",
      body: JSON.stringify({ pin, content })
    });
    fillForm();
    setStatus("配置已保存，刷新前台即可看到更新。");
  } catch (error) {
    setStatus(`保存失败：${error.message}`);
  }
});

document.querySelector("#add-resource").addEventListener("click", () => {
  state.resources.push({ title: "新资料", url: "#" });
  renderResources();
});

resourceList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-resource]");
  if (!button) return;
  state.resources.splice(Number(button.dataset.removeResource), 1);
  renderResources();
});

document.querySelector("#refresh-leads").addEventListener("click", loadLeads);

loadContent().catch((error) => setStatus(`加载失败：${error.message}`));
loadLeads().catch(() => {});
