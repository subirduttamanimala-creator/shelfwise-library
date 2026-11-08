"use strict";

const STORE_KEY = "shelfwise-library-v1";
const coverColors = ["#6a8170", "#bd9366", "#74869a", "#9b7779", "#708b88", "#b08059", "#7c7896"];
const starterData = {
  books: [
    { id: "sw-101", title: "The Midnight Library", author: "Matt Haig", genre: "Fiction", year: 2020, copies: 3, isbn: "9780525559474", added: "2026-02-14" },
    { id: "sw-102", title: "Braiding Sweetgrass", author: "Robin Wall Kimmerer", genre: "Science", year: 2013, copies: 2, isbn: "9781571313560", added: "2026-02-12" },
    { id: "sw-103", title: "The Song of Achilles", author: "Madeline Miller", genre: "Fiction", year: 2011, copies: 2, isbn: "9780062060624", added: "2026-02-09" },
    { id: "sw-104", title: "A Psalm for the Wild-Built", author: "Becky Chambers", genre: "Science fiction", year: 2021, copies: 2, isbn: "9781250236210", added: "2026-02-06" },
    { id: "sw-105", title: "The Creative Act", author: "Rick Rubin", genre: "Non-fiction", year: 2023, copies: 1, isbn: "9780593652886", added: "2026-02-02" },
    { id: "sw-106", title: "Piranesi", author: "Susanna Clarke", genre: "Fantasy", year: 2020, copies: 2, isbn: "9781635575637", added: "2026-01-29" }
  ],
  loans: [
    { id: "ln-201", bookId: "sw-101", reader: "Mira Sen", borrowed: daysAgo(5), due: daysFromNow(2), returned: null },
    { id: "ln-202", bookId: "sw-103", reader: "Arjun Das", borrowed: daysAgo(12), due: daysAgo(2), returned: null },
    { id: "ln-203", bookId: "sw-104", reader: "Rhea Bose", borrowed: daysAgo(3), due: daysFromNow(8), returned: null }
  ]
};
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return dateInput(d); }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return dateInput(d); }
function dateInput(d) { const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 10); }
function loadState() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved) { const data = JSON.parse(saved); if (Array.isArray(data.books) && Array.isArray(data.loans)) return data; }
  } catch (error) { console.warn("Shelfwise could not read saved data.", error); }
  return structuredClone(starterData);
}
let state = loadState();
let loanFilter = "active";
let pendingDeleteId = null;
let toastTimer;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const bookById = id => state.books.find(book => book.id === id);
const activeLoans = () => state.loans.filter(loan => !loan.returned);
const loansForBook = id => activeLoans().filter(loan => loan.bookId === id).length;
const availableCopies = book => Math.max(0, Number(book.copies) - loansForBook(book.id));
const prettyDate = date => date ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${date}T12:00:00`)) : "—";
const isOverdue = loan => !loan.returned && loan.due < dateInput(new Date());
const makeId = prefix => `${prefix}-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (error) { console.warn("Shelfwise could not save data.", error); showToast("Could not save changes in this browser."); } }
function showToast(message) { const toast = $("#toast"); toast.textContent = message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove("show"), 2600); }
function cover(book, index = 0) { const color = coverColors[(state.books.findIndex(item => item.id === book.id) + coverColors.length) % coverColors.length] || coverColors[index % coverColors.length]; return `<span class="book-cover" style="background:${color}" aria-hidden="true">${escapeHtml(book.title.split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase())}</span>`; }
function render() { renderMetrics(); renderRecent(); renderDashboardLoans(); renderCollection(); renderLoanList(); renderLoanOptions(); renderGenres(); }
function renderMetrics() {
  const active = activeLoans();
  const overdue = active.filter(isOverdue).length;
  const available = state.books.reduce((sum, book) => sum + availableCopies(book), 0);
  $("#statTitles").textContent = state.books.length;
  $("#statAvailable").textContent = available;
  $("#statLoans").textContent = active.length;
  $("#statOverdue").textContent = overdue;
  $("#loanFoot").textContent = active.length === 1 ? "Across all active loans" : "Across all active loans";
  $("#navBookCount").textContent = state.books.length;
  $("#navLoanCount").textContent = active.length;
  $("#loanActiveCount").textContent = active.length;
  $("#loanDueCount").textContent = active.filter(loan => { const days = (new Date(`${loan.due}T12:00:00`) - new Date(`${dateInput(new Date())}T12:00:00`)) / 86400000; return days >= 0 && days <= 3; }).length;
  const month = dateInput(new Date()).slice(0, 7);
  $("#loanReturnedCount").textContent = state.loans.filter(loan => loan.returned?.startsWith(month)).length;
  $("#todayLabel").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date());
}
function renderRecent() {
  const books = [...state.books].sort((a, b) => (b.added || "").localeCompare(a.added || "")).slice(0, 4);
  $("#recentList").innerHTML = books.length ? books.map((book, index) => `<div class="recent-row">${cover(book, index)}<div class="book-meta"><strong>${escapeHtml(book.title)}</strong><span>${escapeHtml(book.author)} · ${escapeHtml(book.genre)}</span></div><span class="book-availability">${availableCopies(book)} of ${book.copies} free</span></div>`).join("") : `<div class="empty-inline">Your collection is ready for its first story.</div>`;
}
function renderDashboardLoans() {
  const loans = activeLoans().sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3);
  $("#dashboardLoans").innerHTML = loans.length ? loans.map(loan => {
    const book = bookById(loan.bookId); if (!book) return "";
    const overdue = isOverdue(loan);
    return `<div class="activity-row"><span class="reader-avatar">${escapeHtml(loan.reader.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase())}</span><div class="activity-copy"><strong>${escapeHtml(book.title)}</strong><span>${escapeHtml(loan.reader)} · due ${prettyDate(loan.due)}</span></div><span class="due-tag${overdue ? " overdue" : ""}">${overdue ? "Past due" : `Due ${prettyDate(loan.due).replace(/, \d{4}$/, "")}`}</span></div>`;
  }).join("") : `<div class="empty-inline">No books are checked out right now.</div>`;
}
function renderGenres() {
  const select = $("#genreFilter"); const current = select.value;
  const genres = [...new Set(state.books.map(book => book.genre).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  select.innerHTML = `<option value="all">All genres</option>${genres.map(genre => `<option value="${escapeHtml(genre)}">${escapeHtml(genre)}</option>`).join("")}`;
  if (genres.includes(current)) select.value = current;
}
function renderCollection() {
  const query = $("#bookSearch").value.trim().toLocaleLowerCase();
  const genre = $("#genreFilter").value; const availability = $("#availabilityFilter").value;
  const filtered = [...state.books].filter(book => {
    const matches = `${book.title} ${book.author} ${book.genre} ${book.isbn || ""}`.toLocaleLowerCase().includes(query);
    return matches && (genre === "all" || book.genre === genre) && (availability === "all" || (availability === "available" ? availableCopies(book) > 0 : availableCopies(book) === 0));
  }).sort((a, b) => a.title.localeCompare(b.title));
  $("#resultCount").textContent = `${filtered.length} ${filtered.length === 1 ? "title" : "titles"}`;
  $("#bookTable").innerHTML = filtered.map((book, index) => {
    const available = availableCopies(book);
    return `<tr><td><div class="table-book">${cover(book, index)}<div class="table-book-copy"><strong>${escapeHtml(book.title)}</strong><span>${book.isbn ? `ISBN ${escapeHtml(book.isbn)}` : "In your library"}</span></div></div></td><td>${escapeHtml(book.author)}</td><td><span class="genre-pill">${escapeHtml(book.genre)}</span></td><td>${escapeHtml(book.year || "—")}</td><td><span class="availability ${available ? "ok" : "none"}">${available} of ${book.copies} available</span></td><td><div class="row-actions"><button class="small-action borrow" data-checkout="${escapeHtml(book.id)}" ${available ? "" : "disabled"}>Check out</button><button class="small-action" data-edit="${escapeHtml(book.id)}">Edit</button><button class="small-action" data-delete="${escapeHtml(book.id)}" aria-label="Remove ${escapeHtml(book.title)}">···</button></div></td></tr>`;
  }).join("");
  $("#emptyBooks").classList.toggle("hidden", filtered.length > 0);
  $(".table-wrap").classList.toggle("hidden", filtered.length === 0);
}
function renderLoanOptions() {
  const select = $("#loanBook");
  const available = state.books.filter(book => availableCopies(book) > 0).sort((a, b) => a.title.localeCompare(b.title));
  select.innerHTML = available.length ? available.map(book => `<option value="${escapeHtml(book.id)}">${escapeHtml(book.title)} — ${availableCopies(book)} available</option>`).join("") : `<option value="">No books available to check out</option>`;
  $("#newLoanButton").disabled = available.length === 0;
  $("#newLoanButton").title = available.length ? "Check out an available book" : "Add an available book first";
}
function renderLoanList() {
  const loans = [...state.loans].filter(loan => loanFilter === "all" || (loanFilter === "returned" ? Boolean(loan.returned) : !loan.returned)).sort((a, b) => (a.returned || a.due).localeCompare(b.returned || b.due));
  $("#loanList").innerHTML = loans.map(loan => {
    const book = bookById(loan.bookId); if (!book) return "";
    const overdue = isOverdue(loan); const status = loan.returned ? "Returned" : overdue ? "Past due" : `Due ${prettyDate(loan.due)}`;
    return `<div class="loan-row"><div class="loan-book">${cover(book)}<div class="loan-person"><strong>${escapeHtml(book.title)}</strong><span>Checked out ${prettyDate(loan.borrowed)}</span></div></div><div class="loan-person"><strong>${escapeHtml(loan.reader)}</strong><span>Reader</span></div><span class="loan-status loan-due${overdue ? " overdue" : loan.returned ? " returned" : ""}">${escapeHtml(status)}</span>${loan.returned ? `<span class="small-action">Returned ${prettyDate(loan.returned)}</span>` : `<button class="small-action" data-return="${escapeHtml(loan.id)}">Mark returned</button>`}</div>`;
  }).join("");
  $("#emptyLoans").classList.toggle("hidden", loans.length > 0);
  $("#loanList").classList.toggle("hidden", loans.length === 0);
}
function switchView(view) {
  $$(".view").forEach(section => section.classList.toggle("active", section.id === `${view}View`));
  $$(".nav-item").forEach(button => button.classList.toggle("active", button.dataset.view === view));
  const labels = { overview: "Overview", collection: "Collection", loans: "Loans" };
  $("#crumbCurrent").textContent = labels[view] || "Overview";
  $("#sidebar").classList.remove("open");
}
function openBookModal(book = null) {
  $("#bookForm").reset(); $("#editBookId").value = book?.id || "";
  $("#bookModalTitle").textContent = book ? "Edit book details" : "Add a book";
  $("#bookSubmit").textContent = book ? "Save changes" : "Add to collection";
  $("#bookTitle").value = book?.title || ""; $("#bookAuthor").value = book?.author || "";
  $("#bookGenre").value = book?.genre || ""; $("#bookYear").value = book?.year || "";
  $("#bookCopies").value = book?.copies || 1; $("#bookIsbn").value = book?.isbn || "";
  $("#bookModal").showModal();
}
function openLoanModal(bookId = "") {
  renderLoanOptions();
  if (!$("#loanBook").options.length || !$("#loanBook").value) { showToast("Add an available book before checking one out."); return; }
  if (bookId && [...$("#loanBook").options].some(option => option.value === bookId)) $("#loanBook").value = bookId;
  const due = new Date(); due.setDate(due.getDate() + 14); $("#dueDate").value = dateInput(due);
  $("#loanModal").showModal();
}
function returnLoan(id) {
  const loan = state.loans.find(item => item.id === id && !item.returned); if (!loan) return;
  loan.returned = dateInput(new Date()); save(); render(); showToast("Book marked as returned. Thanks!");
}
function closeModal(button) { button.closest("dialog")?.close(); }

$$(".nav-item").forEach(button => button.addEventListener("click", () => switchView(button.dataset.view)));
$$("[data-go]").forEach(button => button.addEventListener("click", () => switchView(button.dataset.go)));
$$("[data-open-add]").forEach(button => button.addEventListener("click", () => openBookModal()));
$$("[data-close-dialog]").forEach(button => button.addEventListener("click", () => closeModal(button)));
$("#mobileMenu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#bookSearch").addEventListener("input", renderCollection);
$("#genreFilter").addEventListener("change", renderCollection);
$("#availabilityFilter").addEventListener("change", renderCollection);
$("#newLoanButton").addEventListener("click", () => openLoanModal());
$("#bookTable").addEventListener("click", event => {
  const edit = event.target.closest("[data-edit]"); const del = event.target.closest("[data-delete]"); const checkout = event.target.closest("[data-checkout]");
  if (edit) openBookModal(bookById(edit.dataset.edit));
  if (checkout) openLoanModal(checkout.dataset.checkout);
  if (del) { const book = bookById(del.dataset.delete); if (activeLoans().some(loan => loan.bookId === book.id)) { showToast("Return this book’s active loans before removing it."); return; } pendingDeleteId = book.id; $("#confirmModal").showModal(); }
});
$("#confirmDelete").addEventListener("click", () => {
  if (pendingDeleteId) { state.books = state.books.filter(book => book.id !== pendingDeleteId); state.loans = state.loans.filter(loan => loan.bookId !== pendingDeleteId); pendingDeleteId = null; save(); render(); showToast("Book removed from your collection."); }
  $("#confirmModal").close();
});
$("#bookForm").addEventListener("submit", event => {
  event.preventDefault();
  const id = $("#editBookId").value; const previous = id ? bookById(id) : null;
  const copies = Number($("#bookCopies").value);
  if (previous && copies < loansForBook(id)) { showToast(`At least ${loansForBook(id)} copies are currently checked out.`); return; }
  const book = { id: id || makeId("book"), title: $("#bookTitle").value.trim(), author: $("#bookAuthor").value.trim(), genre: $("#bookGenre").value, year: $("#bookYear").value ? Number($("#bookYear").value) : "", copies, isbn: $("#bookIsbn").value.trim(), added: previous?.added || dateInput(new Date()) };
  if (previous) state.books = state.books.map(item => item.id === id ? book : item); else state.books.push(book);
  save(); render(); $("#bookModal").close(); showToast(previous ? "Book details updated." : "Book added to your collection.");
});
$("#loanForm").addEventListener("submit", event => {
  event.preventDefault(); const book = bookById($("#loanBook").value); const reader = $("#readerName").value.trim(); const due = $("#dueDate").value;
  if (!book || !reader || !due || availableCopies(book) < 1) { showToast("Choose an available book and add the reader’s name."); return; }
  state.loans.push({ id: makeId("loan"), bookId: book.id, reader, borrowed: dateInput(new Date()), due, returned: null });
  save(); render(); $("#loanForm").reset(); $("#loanModal").close(); showToast(`${book.title} checked out to ${reader}.`);
});
$("#loanList").addEventListener("click", event => { const button = event.target.closest("[data-return]"); if (button) returnLoan(button.dataset.return); });
$$("[data-loan-filter]").forEach(button => button.addEventListener("click", () => { loanFilter = button.dataset.loanFilter; $$("[data-loan-filter]").forEach(item => item.classList.toggle("selected", item === button)); renderLoanList(); }));
$("#exportButton").addEventListener("click", () => {
  const rows = [["Title", "Author", "Genre", "Year", "Copies", "Available", "ISBN"], ...state.books.map(book => [book.title, book.author, book.genre, book.year, book.copies, availableCopies(book), book.isbn || ""])];
  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = "shelfwise-collection.csv"; link.click(); URL.revokeObjectURL(url); showToast("Collection exported as CSV.");
});

render();

