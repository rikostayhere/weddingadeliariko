/**
 * Wedding WhatsApp Invitation Generator & Excel Management
 * For: Adelia Arifanti & Riko Oktavian
 */

(function () {
  'use strict';

  // --- Constants & Defaults ---
  const DEFAULT_WEBSITE = "https://weddingrikoadel.my.id/";

  const DEFAULT_TEMPLATE = `_Assalamualaikum Warahmatullahi Wabarakaatuh_
Dengan memohon rahmat dan ridho Allah SWT, perkenankan kami mengundang Saudara untuk menghadiri acara pernikahan kami :


*Adelia Arifanti*
dengan
*Riko Oktavian*


*Untuk informasi detail mengenai acara, silahkan kunjungi link dibawah ini :*
{link}


Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Saudara berkenan untuk hadir dan memberikan doa restu.
Atas kehadiran dan doa restunya kami ucapkan terima kasih.
_Wassalamualaikum Warahmatullahi Wabarakaatuh_
Hormat kami,
*Adel & Riko*`;

  const SAMPLE_GUESTS = `Mas Budi, 081234567890
Pak Ahmad Santoso, 085712345678
Ibu Sri Wahyuni, 081398765432
Keluarga Besar Bpk. Joko, 089611223344
Dr. Hendra Kusuma, +62 821-5555-8888
Mbak Dian & Pasangan, 087799887766
Bu Siti Aminah
Om Robert & Tante Maya
Rekan Kerja Divisi IT, 081200001111`;

  // --- State Variables ---
  let generatedData = [];
  let currentFilteredData = [];
  let currentView = 'table'; // 'table' or 'card'

  // --- DOM Elements ---
  const guestListInput = document.getElementById("guestList");
  const websiteUrlInput = document.getElementById("websiteUrl");
  const templateTextInput = document.getElementById("templateText");
  const resetTemplateBtn = document.getElementById("resetTemplateBtn");
  const generateBtn = document.getElementById("generateBtn");
  const sampleDataBtn = document.getElementById("sampleDataBtn");
  const clearBtn = document.getElementById("clearBtn");

  const resultsSection = document.getElementById("resultsSection");
  const statTotalGuests = document.getElementById("statTotalGuests");
  const statWithPhone = document.getElementById("statWithPhone");
  const statNoPhone = document.getElementById("statNoPhone");

  const exportExcelBtn = document.getElementById("exportExcelBtn");
  const copySpreadsheetBtn = document.getElementById("copySpreadsheetBtn");
  const exportCsvBtn = document.getElementById("exportCsvBtn");

  const searchInput = document.getElementById("searchInput");
  const clearSearchBtn = document.getElementById("clearSearchBtn");
  const filterTypeSelect = document.getElementById("filterType");

  const viewTableBtn = document.getElementById("viewTableBtn");
  const viewCardBtn = document.getElementById("viewCardBtn");
  const tableViewContainer = document.getElementById("tableViewContainer");
  const cardViewContainer = document.getElementById("cardViewContainer");
  const tableBody = document.getElementById("tableBody");
  const emptyTableMessage = document.getElementById("emptyTableMessage");

  // Modal DOM
  const messageModal = document.getElementById("messageModal");
  const modalGuestName = document.getElementById("modalGuestName");
  const modalMessageText = document.getElementById("modalMessageText");
  const modalOpenWaBtn = document.getElementById("modalOpenWaBtn");
  const copyModalMessageBtn = document.getElementById("copyModalMessageBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");

  // Toast Container
  const toastContainer = document.getElementById("toastContainer");

  // --- Initialization ---
  function init() {
    templateTextInput.value = DEFAULT_TEMPLATE;
    setupEventListeners();
  }

  // --- Event Listeners ---
  function setupEventListeners() {
    generateBtn.addEventListener("click", handleGenerate);
    sampleDataBtn.addEventListener("click", handleLoadSampleData);
    clearBtn.addEventListener("click", handleClearInput);
    resetTemplateBtn.addEventListener("click", handleResetTemplate);

    exportExcelBtn.addEventListener("click", handleExportExcel);
    copySpreadsheetBtn.addEventListener("click", handleCopySpreadsheet);
    exportCsvBtn.addEventListener("click", handleExportCsv);

    searchInput.addEventListener("input", handleFilterChange);
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearSearchBtn.classList.add("hidden");
      handleFilterChange();
    });

    filterTypeSelect.addEventListener("change", handleFilterChange);

    viewTableBtn.addEventListener("click", () => switchView('table'));
    viewCardBtn.addEventListener("click", () => switchView('card'));

    // Modal Events
    closeModalBtn.addEventListener("click", closeModal);
    messageModal.addEventListener("click", (e) => {
      if (e.target === messageModal) closeModal();
    });
    copyModalMessageBtn.addEventListener("click", () => {
      copyToClipboard(modalMessageText.innerText, "Pesan WhatsApp berhasil disalin!");
    });

    // Keyboard support for ESC
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !messageModal.classList.contains("hidden")) {
        closeModal();
      }
    });
  }

  // --- Core Generation Logic ---
  function handleGenerate() {
    const rawInput = guestListInput.value.trim();
    if (!rawInput) {
      showToast("Harap masukkan daftar nama tamu terlebih dahulu.", "error");
      guestListInput.focus();
      return;
    }

    const websiteBase = (websiteUrlInput.value.trim() || DEFAULT_WEBSITE).replace(/\/?$/, "/");
    const template = templateTextInput.value.trim() || DEFAULT_TEMPLATE;

    const lines = rawInput.split(/\r?\n+/);
    generatedData = [];
    let count = 0;

    lines.forEach((line) => {
      let trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Parse delimiters: Tab (from Excel), comma, or semicolon
      let parts;
      if (trimmedLine.includes("\t")) {
        parts = trimmedLine.split("\t");
      } else if (trimmedLine.includes(",")) {
        parts = trimmedLine.split(",");
      } else if (trimmedLine.includes(";")) {
        parts = trimmedLine.split(";");
      } else {
        parts = [trimmedLine, ""];
      }

      let nama = parts[0] ? parts[0].trim().replace(/^["']|["']$/g, "") : "";
      let nomorRaw = parts.slice(1).join(",").trim().replace(/^["']|["']$/g, "");

      if (!nama) return;

      count++;
      const nomorFormatted = formatNomor(nomorRaw);
      const inviteUrl = websiteBase + "?to=" + encodeURIComponent(nama);

      const pesanLengkap = template
        .replace(/{tamu}/g, nama)
        .replace(/{link}/g, inviteUrl);

      const waUrl = (nomorFormatted
        ? "https://wa.me/" + nomorFormatted
        : "https://wa.me/") + "?text=" + encodeURIComponent(pesanLengkap);

      generatedData.push({
        id: count,
        nama: nama,
        nomorOriginal: nomorRaw,
        nomorFormatted: nomorFormatted,
        inviteUrl: inviteUrl,
        pesan: pesanLengkap,
        waUrl: waUrl,
        hasPhone: Boolean(nomorFormatted)
      });
    });

    if (generatedData.length === 0) {
      showToast("Tidak ada data tamu yang valid ditemukan.", "error");
      return;
    }

    updateStats();
    resultsSection.classList.remove("hidden");
    handleFilterChange();

    showToast(`Berhasil men-generate ${generatedData.length} data undangan!`, "success");

    // Scroll smoothly to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // --- Phone Number Formatter ---
  function formatNomor(numStr) {
    if (!numStr) return "";
    let cleaned = numStr.replace(/\D/g, "");
    if (!cleaned) return "";

    // If starts with 0, replace with 62 (Indonesia)
    if (cleaned.startsWith("0")) {
      cleaned = "62" + cleaned.slice(1);
    } else if (cleaned.startsWith("8")) {
      // Sometimes people omit 0, e.g. 8123456789
      cleaned = "62" + cleaned;
    }

    return cleaned;
  }

  // --- Statistics Update ---
  function updateStats() {
    const total = generatedData.length;
    const withPhone = generatedData.filter(item => item.hasPhone).length;
    const noPhone = total - withPhone;

    statTotalGuests.textContent = total;
    statWithPhone.textContent = withPhone;
    statNoPhone.textContent = noPhone;
  }

  // --- Search & Filter Logic ---
  function handleFilterChange() {
    const query = searchInput.value.trim().toLowerCase();
    const filter = filterTypeSelect.value;

    if (query) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }

    currentFilteredData = generatedData.filter(item => {
      // Type filter
      if (filter === "with_phone" && !item.hasPhone) return false;
      if (filter === "no_phone" && item.hasPhone) return false;

      // Text query
      if (query) {
        const matchName = item.nama.toLowerCase().includes(query);
        const matchPhone = item.nomorFormatted.includes(query) || item.nomorOriginal.toLowerCase().includes(query);
        return matchName || matchPhone;
      }

      return true;
    });

    renderViews();
  }

  // --- Render Views (Table & Cards) ---
  function renderViews() {
    renderTable();
    renderCards();

    const hasData = currentFilteredData.length > 0;
    emptyTableMessage.classList.toggle("hidden", hasData);
  }

  function renderTable() {
    tableBody.innerHTML = "";

    currentFilteredData.forEach(item => {
      const tr = document.createElement("tr");

      const initial = item.nama.charAt(0).toUpperCase();

      tr.innerHTML = `
        <td style="color: var(--text-muted); font-size: 0.8rem; text-align: center;">${item.id}</td>
        <td>
          <div class="guest-name-cell">
            <div class="guest-avatar">${initial}</div>
            <div class="guest-name-text">${escapeHtml(item.nama)}</div>
          </div>
        </td>
        <td>
          ${item.hasPhone
          ? `<span class="phone-badge">${escapeHtml(item.nomorFormatted)}</span>`
          : `<span class="phone-empty">Tanpa No. WA</span>`
        }
        </td>
        <td>
          <div class="link-cell-wrapper">
            <a href="${item.inviteUrl}" target="_blank" class="link-text" title="${item.inviteUrl}">${escapeHtml(item.inviteUrl)}</a>
            <button type="button" class="btn-icon-copy" title="Salin Link Web" data-copy-type="invite" data-id="${item.id}">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          </div>
        </td>
        <td>
          <button type="button" class="btn btn-outline btn-sm" data-preview-id="${item.id}" title="Preview Pesan">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Lihat Pesan
          </button>
        </td>
        <td>
          <div class="action-buttons-group">
            <button type="button" class="btn btn-primary-outline btn-sm" title="Salin Teks Pesan Undangan" data-copy-type="msg" data-id="${item.id}">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              Salin Teks
            </button>
            ${item.hasPhone ? `
              <a href="${item.waUrl}" target="_blank" class="btn btn-wa btn-sm" title="Buka WhatsApp">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Buka WA
              </a>
            ` : `
              <button type="button" class="btn btn-outline btn-sm" style="opacity: 0.6; cursor: not-allowed;" title="Nomor WA tidak diisi" disabled>
                Tanpa No. WA
              </button>
            `}
          </div>
        </td>
      `;

      tableBody.appendChild(tr);
    });

    attachItemActionListeners(tableBody);
  }

  function renderCards() {
    cardViewContainer.innerHTML = "";

    currentFilteredData.forEach(item => {
      const card = document.createElement("div");
      card.className = "guest-card";

      const initial = item.nama.charAt(0).toUpperCase();

      card.innerHTML = `
        <div class="guest-card-header">
          <div class="guest-avatar">${initial}</div>
          <div class="guest-card-title">${escapeHtml(item.nama)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">#${item.id}</div>
        </div>
        <div class="guest-card-body">
          <div class="guest-card-row">
            <span class="guest-card-label">Nomor WhatsApp</span>
            <span>
              ${item.hasPhone
          ? `<span class="phone-badge">${escapeHtml(item.nomorFormatted)}</span>`
          : `<span class="phone-empty">Tanpa No. WA</span>`
        }
            </span>
          </div>
          <div class="guest-card-row">
            <span class="guest-card-label">Link Undangan Web</span>
            <div class="link-cell-wrapper">
              <a href="${item.inviteUrl}" target="_blank" class="link-text">${escapeHtml(item.inviteUrl)}</a>
              <button type="button" class="btn-icon-copy" title="Salin Link Web" data-copy-type="invite" data-id="${item.id}">
                <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              </button>
            </div>
          </div>
        </div>
        <div class="guest-card-footer">
          <button type="button" class="btn btn-primary-outline btn-sm" data-copy-type="msg" data-id="${item.id}" title="Salin Teks Pesan Undangan">
            <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Salin Teks Pesan
          </button>
          <button type="button" class="btn btn-outline btn-sm" data-preview-id="${item.id}">
            Lihat Pesan
          </button>
          ${item.hasPhone ? `
            <a href="${item.waUrl}" target="_blank" class="btn btn-wa btn-sm" title="Buka WhatsApp">
              <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Buka WA
            </a>
          ` : ''}
        </div>
      `;

      cardViewContainer.appendChild(card);
    });

    attachItemActionListeners(cardViewContainer);
  }

  function attachItemActionListeners(parent) {
    // Copy buttons
    parent.querySelectorAll("[data-copy-type]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-id"), 10);
        const item = generatedData.find(g => g.id === id);
        if (!item) return;

        const type = btn.getAttribute("data-copy-type");
        if (type === "invite") {
          copyToClipboard(item.inviteUrl, `Link web untuk ${item.nama} disalin!`);
        } else if (type === "msg") {
          copyToClipboard(item.pesan, `Teks pesan undangan untuk ${item.nama} berhasil disalin!`);
        }
      });
    });

    // Preview buttons
    parent.querySelectorAll("[data-preview-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = parseInt(btn.getAttribute("data-preview-id"), 10);
        const item = generatedData.find(g => g.id === id);
        if (!item) return;

        openModal(item);
      });
    });
  }

  // --- Switch View (Table / Card) ---
  function switchView(view) {
    currentView = view;
    if (view === 'table') {
      viewTableBtn.classList.add("active");
      viewCardBtn.classList.remove("active");
      tableViewContainer.classList.remove("hidden");
      cardViewContainer.classList.add("hidden");
    } else {
      viewCardBtn.classList.add("active");
      viewTableBtn.classList.remove("active");
      tableViewContainer.classList.add("hidden");
      cardViewContainer.classList.remove("hidden");
    }
  }

  // --- EXPORT KE EXCEL (.XLSX) ---
  function handleExportExcel() {
    if (generatedData.length === 0) {
      showToast("Belum ada data untuk diekspor. Klik 'Generate' terlebih dahulu.", "error");
      return;
    }

    try {
      if (typeof XLSX === "undefined") {
        throw new Error("Library SheetJS (XLSX) tidak terdeteksi. Silakan coba kembali atau gunakan Unduh CSV.");
      }

      // Structure rows for Excel with clear, structured columns
      const excelRows = generatedData.map((item, idx) => ({
        "No": idx + 1,
        "Nama Tamu": item.nama,
        "Nomor WhatsApp": item.nomorFormatted ? "'" + item.nomorFormatted : "-",
        "Link Undangan Web": item.inviteUrl,
        "Teks Pesan WhatsApp": item.pesan,
        "Status Kirim": "Belum Dikirim"
      }));

      // Create Worksheet
      const ws = XLSX.utils.json_to_sheet(excelRows);

      // Set optimal column widths
      ws['!cols'] = [
        { wch: 6 },   // No
        { wch: 28 },  // Nama Tamu
        { wch: 18 },  // Nomor WhatsApp
        { wch: 45 },  // Link Undangan Web
        { wch: 80 },  // Teks Pesan WhatsApp
        { wch: 15 }   // Status Kirim
      ];

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Daftar Undangan");

      // Generate filename with current date
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `Daftar_Undangan_Adel_Riko_${dateStr}.xlsx`;

      XLSX.writeFile(wb, filename);

      showToast(`File Excel berhasil diunduh: ${filename}`, "excel");
    } catch (err) {
      console.error("Export Excel error:", err);
      showToast("Gagal export ke Excel: " + err.message, "error");
    }
  }

  // --- COPY SPREADSHEET (TSV - TAB SEPARATED VALUES) ---
  // Super user-friendly feature: allows 1-click paste directly into Excel or Google Sheets!
  function handleCopySpreadsheet() {
    if (generatedData.length === 0) {
      showToast("Belum ada data untuk disalin. Klik 'Generate' terlebih dahulu.", "error");
      return;
    }

    try {
      const headers = ["No", "Nama Tamu", "Nomor WhatsApp", "Link Undangan Web", "Teks Pesan WhatsApp", "Status Kirim"];
      const rows = [headers.join("\t")];

      generatedData.forEach((item, idx) => {
        // In TSV, wrap multiline text in quotes or replace inner tabs/newlines cleanly
        const cleanMessage = `"${item.pesan.replace(/"/g, '""')}"`;
        const cleanName = `"${item.nama.replace(/"/g, '""')}"`;
        const phone = item.nomorFormatted ? `="${item.nomorFormatted}"` : "-";

        rows.push([
          idx + 1,
          cleanName,
          phone,
          item.inviteUrl,
          cleanMessage,
          "Belum Dikirim"
        ].join("\t"));
      });

      const tsvContent = rows.join("\r\n");
      copyToClipboard(
        tsvContent,
        "Format Excel disalin! Buka Microsoft Excel / Google Sheets lalu tekan Ctrl+V."
      );
    } catch (err) {
      console.error("Copy spreadsheet error:", err);
      showToast("Gagal menyalin data spreadsheet.", "error");
    }
  }

  // --- EXPORT CSV FALLBACK ---
  function handleExportCsv() {
    if (generatedData.length === 0) {
      showToast("Belum ada data untuk diekspor.", "error");
      return;
    }

    try {
      const headers = ["No", "Nama Tamu", "Nomor WhatsApp", "Link Undangan Web", "Teks Pesan WhatsApp", "Status Kirim"];
      const csvLines = [headers.map(csvEscape).join(",")];

      generatedData.forEach((item, idx) => {
        csvLines.push([
          idx + 1,
          item.nama,
          item.nomorFormatted ? `'${item.nomorFormatted}` : "-",
          item.inviteUrl,
          item.pesan,
          "Belum Dikirim"
        ].map(csvEscape).join(","));
      });

      // Include UTF-8 BOM so Indonesian Excel displays accents and formatting accurately
      const bom = "\uFEFF";
      const blob = new Blob([bom + csvLines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `Daftar_Undangan_Adel_Riko_${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast("File CSV berhasil diunduh!", "success");
    } catch (err) {
      console.error("Export CSV error:", err);
      showToast("Gagal mengunduh CSV.", "error");
    }
  }

  function csvEscape(val) {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  }

  // --- Modal Preview Handler ---
  function openModal(item) {
    modalGuestName.textContent = `Preview Pesan untuk: ${item.nama}`;
    modalMessageText.textContent = item.pesan;
    modalOpenWaBtn.href = item.waUrl;
    messageModal.classList.remove("hidden");
  }

  function closeModal() {
    messageModal.classList.add("hidden");
  }

  // --- Helper Actions ---
  function handleLoadSampleData() {
    guestListInput.value = SAMPLE_GUESTS;
    showToast("Contoh data tamu berhasil dimuat. Klik 'Generate Data Undangan' untuk memproses.", "info");
  }

  function handleClearInput() {
    if (!guestListInput.value.trim() && generatedData.length === 0) return;

    if (confirm("Apakah Anda yakin ingin mengosongkan daftar tamu dan hasil generate?")) {
      guestListInput.value = "";
      generatedData = [];
      currentFilteredData = [];
      resultsSection.classList.add("hidden");
      tableBody.innerHTML = "";
      cardViewContainer.innerHTML = "";
      showToast("Data berhasil dibersihkan.", "info");
    }
  }

  function handleResetTemplate() {
    if (confirm("Kembalikan template pesan ke default asli?")) {
      templateTextInput.value = DEFAULT_TEMPLATE;
      websiteUrlInput.value = DEFAULT_WEBSITE;
      showToast("Template pesan berhasil direset.", "info");
    }
  }

  function copyToClipboard(text, successMsg) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(successMsg, "success");
      }).catch(err => {
        fallbackCopyTextToClipboard(text, successMsg);
      });
    } else {
      fallbackCopyTextToClipboard(text, successMsg);
    }
  }

  function fallbackCopyTextToClipboard(text, successMsg) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        showToast(successMsg, "success");
      } else {
        showToast("Gagal menyalin teks secara otomatis.", "error");
      }
    } catch (err) {
      showToast("Gagal menyalin teks.", "error");
    }

    document.body.removeChild(textArea);
  }

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // --- Toast Notification System ---
  function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = '';
    if (type === 'excel') {
      iconSvg = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#107C41" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    } else if (type === 'error') {
      iconSvg = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
    } else {
      iconSvg = `<svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#25D366" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      toast.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }, 3800);
  }

  // Initialize on DOM load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();