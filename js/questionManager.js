window.VTTT = window.VTTT || {};

window.VTTT.QuestionManager = class QuestionManager {
  constructor(storageKey) {
    this.storageKey = storageKey;
    this.defaultQuestions = [];
    this.questions = [];
  }

  async init() {
    try {
      const res = await fetch("./data/questions.json");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          this.defaultQuestions = data.filter((q) => this.validateQuestion(q).valid);
        }
      }
    } catch (e) {
      console.warn("Không thể tải bộ câu hỏi mặc định:", e);
    }

    this.loadFromStorage();
  }

  validateQuestion(q) {
    if (!q || typeof q !== "object") {
      return { valid: false, error: "Dữ liệu câu hỏi không hợp lệ." };
    }
    if (!q.question || typeof q.question !== "string" || !q.question.trim()) {
      return { valid: false, error: "Thiếu nội dung câu hỏi." };
    }
    if (!Array.isArray(q.options) || q.options.length !== 4) {
      return { valid: false, error: "Phải có đủ 4 phương án A, B, C, D." };
    }
    for (let i = 0; i < 4; i++) {
      if (typeof q.options[i] !== "string" || !q.options[i].trim()) {
        return { valid: false, error: `Phương án ${["A", "B", "C", "D"][i]} đang bị trống.` };
      }
    }
    const idx = Number(q.correctIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx > 3) {
      return { valid: false, error: "Đáp án đúng phải là 0 (A), 1 (B), 2 (C) hoặc 3 (D)." };
    }
    return { valid: true, error: "" };
  }

  loadFromStorage() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const validList = parsed.filter((q) => this.validateQuestion(q).valid);
          if (validList.length > 0) {
            this.questions = validList;
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Dữ liệu câu hỏi trong LocalStorage bị lỗi, tự động khôi phục mặc định.", e);
    }
    this.questions = this.defaultQuestions.map((q) => ({ ...q, options: [...q.options] }));
    this.saveToStorage();
  }

  saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.questions));
    } catch (e) {
      console.warn("Không thể lưu LocalStorage:", e);
    }
  }

  getAll() {
    return this.questions;
  }

  addQuestion(q) {
    const check = this.validateQuestion(q);
    if (!check.valid) return check;
    const newQ = {
      id: "q_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      category: (q.category || "Chung").trim(),
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: Number(q.correctIndex),
      explanation: (q.explanation || "").trim()
    };
    this.questions.unshift(newQ);
    this.saveToStorage();
    return { valid: true, question: newQ };
  }

  updateQuestion(id, q) {
    const check = this.validateQuestion(q);
    if (!check.valid) return check;
    const idx = this.questions.findIndex((item) => item.id === id);
    if (idx === -1) return { valid: false, error: "Không tìm thấy câu hỏi cần sửa." };
    this.questions[idx] = {
      id,
      category: (q.category || "Chung").trim(),
      question: q.question.trim(),
      options: q.options.map((o) => o.trim()),
      correctIndex: Number(q.correctIndex),
      explanation: (q.explanation || "").trim()
    };
    this.saveToStorage();
    return { valid: true };
  }

  deleteQuestion(id) {
    this.questions = this.questions.filter((q) => q.id !== id);
    this.saveToStorage();
  }

  restoreDefaults() {
    this.questions = this.defaultQuestions.map((q) => ({ ...q, options: [...q.options] }));
    this.saveToStorage();
  }

  getCategories() {
    const map = {};
    for (const q of this.questions) {
      const cat = (q.category || "Chung").trim();
      map[cat] = (map[cat] || 0) + 1;
    }
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  shuffleQuestionOptions(q) {
    const tagged = q.options.map((text, idx) => ({
      text,
      isCorrect: idx === q.correctIndex
    }));
    this.shuffleArray(tagged);
    return {
      ...q,
      options: tagged.map((t) => t.text),
      correctIndex: tagged.findIndex((t) => t.isCorrect)
    };
  }

  getSessionQuestions(categoryFilter = "all", countSetting = "all") {
    let pool = this.questions.filter((q) => {
      if (!categoryFilter || categoryFilter === "all") return true;
      return (q.category || "Chung").trim() === categoryFilter;
    });
    pool = this.shuffleArray([...pool]).map((q) => this.shuffleQuestionOptions(q));
    if (!countSetting || countSetting === "all") return pool;
    const n = Math.max(1, Math.min(pool.length, Number(countSetting) || pool.length));
    return pool.slice(0, n);
  }

  exportJSON() {
    return JSON.stringify(this.questions, null, 2);
  }

  exportCSV() {
    const header = ["category", "question", "optionA", "optionB", "optionC", "optionD", "correctIndex", "explanation"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = [header.join(",")];
    for (const q of this.questions) {
      rows.push([
        esc(q.category),
        esc(q.question),
        esc(q.options[0]),
        esc(q.options[1]),
        esc(q.options[2]),
        esc(q.options[3]),
        q.correctIndex,
        esc(q.explanation || "")
      ].join(","));
    }
    return "\uFEFF" + rows.join("\r\n");
  }

  importFromText(text, filename) {
    const isCsv = filename.toLowerCase().endsWith(".csv");
    let imported = [];
    if (isCsv) {
      const lines = this.parseCSV(text);
      if (lines.length < 2) {
        return { ok: false, error: "File CSV không có dữ liệu hoặc sai định dạng." };
      }
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (row.length < 7) {
          return { ok: false, error: `Dòng ${i + 1} trong CSV thiếu cột dữ liệu.` };
        }
        const qObj = {
          id: "imp_" + Date.now() + "_" + i,
          category: row[0] || "Chung",
          question: row[1],
          options: [row[2], row[3], row[4], row[5]],
          correctIndex: Number(row[6]),
          explanation: row[7] || ""
        };
        const check = this.validateQuestion(qObj);
        if (!check.valid) {
          return { ok: false, error: `Lỗi tại dòng ${i + 1}: ${check.error}` };
        }
        imported.push(qObj);
      }
    } else {
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        return { ok: false, error: "File JSON không đúng cú pháp." };
      }
      if (!Array.isArray(data) || data.length === 0) {
        return { ok: false, error: "File JSON phải chứa một mảng câu hỏi không rỗng." };
      }
      for (let i = 0; i < data.length; i++) {
        const check = this.validateQuestion(data[i]);
        if (!check.valid) {
          return { ok: false, error: `Lỗi ở câu thứ ${i + 1}: ${check.error}` };
        }
        imported.push({
          id: data[i].id || `imp_${Date.now()}_${i}`,
          category: (data[i].category || "Chung").trim(),
          question: data[i].question.trim(),
          options: data[i].options.map((o) => o.trim()),
          correctIndex: Number(data[i].correctIndex),
          explanation: (data[i].explanation || "").trim()
        });
      }
    }

    this.questions = imported;
    this.saveToStorage();
    return { ok: true, count: imported.length };
  }

  parseCSV(text) {
    const rows = [];
    let row = [];
    let val = "";
    let inQuotes = false;
    const clean = text.replace(/^\uFEFF/, "");

    for (let i = 0; i < clean.length; i++) {
      const ch = clean[i];
      const next = clean[i + 1];
      if (inQuotes) {
        if (ch === '"' && next === '"') {
          val += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          val += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          row.push(val);
          val = "";
        } else if (ch === "\r" && next === "\n") {
          row.push(val);
          rows.push(row);
          row = [];
          val = "";
          i++;
        } else if (ch === "\n") {
          row.push(val);
          rows.push(row);
          row = [];
          val = "";
        } else {
          val += ch;
        }
      }
    }
    if (val.length > 0 || row.length > 0) {
      row.push(val);
      rows.push(row);
    }
    return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
  }
};
