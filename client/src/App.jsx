import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Eye,
  GraduationCap,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "/api/students";
const PAGE_SIZE = 8;
const EMPTY_STUDENT = {
  studentId: "",
  name: "",
  email: "",
  phone: "",
  course: "",
  year: "",
};
const COURSES = ["CSE", "ECE", "EEE", "DS"];
const YEARS = ["1", "2", "3", "4"];

function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [viewingStudent, setViewingStudent] = useState(null);
  const [form, setForm] = useState(EMPTY_STUDENT);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchStudents = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(API_URL);
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      const msg =
        requestError.response?.data?.message ||
        (requestError.code === "ERR_NETWORK"
          ? "Unable to connect to backend server. Make sure the backend is running at http://127.0.0.1:5000."
          : requestError.message) ||
        "Could not load student records. Check the backend and MongoDB connection.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !query ||
        [student.studentId, student.name, student.email, student.course]
          .some((value) => String(value || "").toLowerCase().includes(query));
      const matchesCourse = !courseFilter || student.course === courseFilter;
      const matchesYear = !yearFilter || student.year === yearFilter;
      return matchesSearch && matchesCourse && matchesYear;
    });
  }, [students, search, courseFilter, yearFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleStudents = filteredStudents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );
  const courseCount = new Set(students.map((student) => student.course).filter(Boolean)).size;
  const yearCount = new Set(students.map((student) => student.year).filter(Boolean)).size;

  const openAddForm = () => {
    setEditingStudent(null);
    setForm(EMPTY_STUDENT);
    setFormError("");
    setFormOpen(true);
  };

  const openEditForm = (student) => {
    setEditingStudent(student);
    setForm({
      studentId: student.studentId || "",
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      course: student.course || "",
      year: student.year || "",
    });
    setFormError("");
    setFormOpen(true);
    setViewingStudent(null);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingStudent(null);
    setForm(EMPTY_STUDENT);
    setFormError("");
  };

  const updateForm = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError("");
  };

  const saveStudent = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    const payload = {
      studentId: form.studentId.trim(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      course: form.course,
      year: form.year,
    };

    try {
      if (editingStudent) {
        const response = await axios.put(`${API_URL}/${editingStudent._id}`, payload);
        setStudents((current) =>
          current.map((student) =>
            student._id === response.data._id ? response.data : student
          )
        );
        setNotice("Student details updated successfully.");
      } else {
        const response = await axios.post(API_URL, payload);
        setStudents((current) => [response.data, ...current]);
        setPage(1);
        setNotice("Student added successfully.");
      }
      setFormOpen(false);
      setEditingStudent(null);
      setForm(EMPTY_STUDENT);
    } catch (requestError) {
      setFormError(
        requestError.response?.data?.message ||
        "Unable to save this student. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteStudent = async (student) => {
    const confirmed = window.confirm(`Delete the record for ${student.name}?`);
    if (!confirmed) return;

    try {
      await axios.delete(`${API_URL}/${student._id}`);
      setStudents((current) => current.filter((item) => item._id !== student._id));
      setNotice("Student record deleted.");
      setError("");
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
        "Unable to delete this student. Please try again."
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCourseFilter("");
    setYearFilter("");
    setPage(1);
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Student Management home">
          <span className="brand-mark"><GraduationCap size={22} /></span>
          <span className="brand-name">Student Management</span>
        </a>
        <span className="topbar-label">CLOUD COMPUTING PRACTICAL</span>
      </header>

      <main className="page-container" id="top">
        <section className="page-heading">
          <div>
            <p className="eyebrow">STUDENT RECORDS</p>
            <h1>Student Management</h1>
            <p className="page-description">
              Add, view, update and maintain student information in one place.
            </p>
          </div>
          <button className="button button-primary" onClick={openAddForm}>
            <Plus size={18} />
            Add student
          </button>
        </section>

        {error && (
          <div className="message message-error" role="alert">
            <span>{error}</span>
            <button className="text-button" onClick={fetchStudents}>Try again</button>
          </div>
        )}
        {notice && (
          <div className="message message-success" role="status">
            <span>{notice}</span>
            <button className="message-close" onClick={() => setNotice("")} aria-label="Dismiss message">
              <X size={16} />
            </button>
          </div>
        )}

        <section className="summary-grid" aria-label="Student summary">
          <SummaryCard icon={<Users size={19} />} label="Total students" value={loading ? "—" : students.length} />
          <SummaryCard icon={<BookOpen size={19} />} label="Courses represented" value={loading ? "—" : courseCount} />
          <SummaryCard icon={<GraduationCap size={19} />} label="Year groups" value={loading ? "—" : yearCount} />
        </section>

        <section className="records-card">
          <div className="records-heading">
            <div>
              <h2>Student directory</h2>
              <p>Student records saved in the connected database.</p>
            </div>
            <button className="button button-secondary refresh-button" onClick={fetchStudents} disabled={loading}>
              <RefreshCw size={16} className={loading ? "spin" : ""} />
              Refresh
            </button>
          </div>

          <div className="filters-row">
            <label className="search-field">
              <Search size={18} />
              <input
                type="search"
                placeholder="Search by student ID, name, email or course"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              />
            </label>
            <select aria-label="Filter by course" value={courseFilter} onChange={(event) => { setCourseFilter(event.target.value); setPage(1); }}>
              <option value="">All courses</option>
              {COURSES.map((course) => <option value={course} key={course}>{course}</option>)}
            </select>
            <select aria-label="Filter by year" value={yearFilter} onChange={(event) => { setYearFilter(event.target.value); setPage(1); }}>
              <option value="">All years</option>
              {YEARS.map((year) => <option value={year} key={year}>Year {year}</option>)}
            </select>
            {(search || courseFilter || yearFilter) && (
              <button className="text-button clear-button" onClick={clearFilters}>Clear filters</button>
            )}
          </div>

          <div className="table-scroll">
            <table className="student-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Phone</th>
                  <th className="actions-heading">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="table-state">Loading student records…</td></tr>
                ) : visibleStudents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="table-state empty-state">
                      <span className="empty-icon"><Users size={24} /></span>
                      <strong>{students.length === 0 ? "No student records yet" : "No matching students"}</strong>
                      <span>{students.length === 0 ? "Add a student to get started." : "Try a different search or filter."}</span>
                      {students.length === 0 && <button className="button button-primary empty-add" onClick={openAddForm}><Plus size={16} /> Add student</button>}
                    </td>
                  </tr>
                ) : visibleStudents.map((student) => (
                  <tr key={student._id}>
                    <td><span className="student-id">{student.studentId}</span></td>
                    <td>
                      <div className="student-cell">
                        <span className="student-avatar">{(student.name || "S").trim().charAt(0).toUpperCase()}</span>
                        <span className="student-identity">
                          <strong>{student.name}</strong>
                          <small>{student.email}</small>
                        </span>
                      </div>
                    </td>
                    <td><span className="course-label">{student.course}</span></td>
                    <td>Year {student.year}</td>
                    <td>{student.phone || "—"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-button" title="View student" aria-label={`View ${student.name}`} onClick={() => setViewingStudent(student)}><Eye size={17} /></button>
                        <button className="icon-button" title="Edit student" aria-label={`Edit ${student.name}`} onClick={() => openEditForm(student)}><Pencil size={16} /></button>
                        <button className="icon-button icon-button-danger" title="Delete student" aria-label={`Delete ${student.name}`} onClick={() => deleteStudent(student)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            <span>
              {filteredStudents.length === 0 ? "Showing 0 students" :
                `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} students`}
            </span>
            <div className="pagination">
              <button aria-label="Previous page" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /> Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button aria-label="Next page" disabled={currentPage >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Next <ChevronRight size={17} /></button>
            </div>
          </div>
        </section>

        <footer className="page-footer">
          <span>Student Management System</span>
          <span>Roll No: 23261A05D9</span>
        </footer>
      </main>

      {formOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeForm(); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="student-form-title">
            <div className="modal-header">
              <div>
                <p className="eyebrow">STUDENT DETAILS</p>
                <h2 id="student-form-title">{editingStudent ? "Edit student" : "Add student"}</h2>
                <p>{editingStudent ? "Update the information below." : "Enter the student's information below."}</p>
              </div>
              <button className="icon-button modal-close" onClick={closeForm} aria-label="Close form"><X size={19} /></button>
            </div>
            {formError && <div className="message message-error form-message" role="alert">{formError}</div>}
            <form onSubmit={saveStudent}>
              <div className="form-grid">
                <FormField label="Student ID" required>
                  <input name="studentId" value={form.studentId} onChange={updateForm} placeholder="e.g. 23261A05D9" maxLength="30" required />
                </FormField>
                <FormField label="Full name" required>
                  <input name="name" value={form.name} onChange={updateForm} placeholder="Enter full name" maxLength="100" required />
                </FormField>
                <FormField label="Email address" required>
                  <input type="email" name="email" value={form.email} onChange={updateForm} placeholder="student@example.com" maxLength="150" required />
                </FormField>
                <FormField label="Phone number">
                  <input type="tel" name="phone" value={form.phone} onChange={updateForm} placeholder="Enter phone number" maxLength="20" />
                </FormField>
                <FormField label="Course" required>
                  <select name="course" value={form.course} onChange={updateForm} required>
                    <option value="">Select course</option>
                    {COURSES.map((course) => <option value={course} key={course}>{course}</option>)}
                  </select>
                </FormField>
                <FormField label="Year of study" required>
                  <select name="year" value={form.year} onChange={updateForm} required>
                    <option value="">Select year</option>
                    {YEARS.map((year) => <option value={year} key={year}>Year {year}</option>)}
                  </select>
                </FormField>
              </div>
              <div className="modal-actions">
                <button type="button" className="button button-secondary" onClick={closeForm} disabled={saving}>Cancel</button>
                <button type="submit" className="button button-primary" disabled={saving}>
                  {saving ? "Saving…" : editingStudent ? "Save changes" : "Add student"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewingStudent && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setViewingStudent(null); }}>
          <section className="modal-card details-card" role="dialog" aria-modal="true" aria-labelledby="student-details-title">
            <div className="modal-header">
              <div>
                <p className="eyebrow">STUDENT RECORD</p>
                <h2 id="student-details-title">Student details</h2>
              </div>
              <button className="icon-button modal-close" onClick={() => setViewingStudent(null)} aria-label="Close details"><X size={19} /></button>
            </div>
            <div className="detail-profile">
              <span className="detail-avatar">{(viewingStudent.name || "S").trim().charAt(0).toUpperCase()}</span>
              <div><h3>{viewingStudent.name}</h3><p>{viewingStudent.studentId}</p></div>
            </div>
            <div className="details-list">
              <DetailRow icon={<Mail size={17} />} label="Email" value={viewingStudent.email} />
              <DetailRow icon={<Phone size={17} />} label="Phone" value={viewingStudent.phone || "Not provided"} />
              <DetailRow icon={<BookOpen size={17} />} label="Course" value={viewingStudent.course} />
              <DetailRow icon={<GraduationCap size={17} />} label="Year" value={`Year ${viewingStudent.year}`} />
            </div>
            <div className="modal-actions">
              <button className="button button-secondary" onClick={() => setViewingStudent(null)}>Close</button>
              <button className="button button-primary" onClick={() => openEditForm(viewingStudent)}><Pencil size={16} /> Edit student</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <article className="summary-card">
      <span className="summary-icon">{icon}</span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </article>
  );
}

function FormField({ label, required, children }) {
  return <label className="form-field"><span>{label}{required && <em> *</em>}</span>{children}</label>;
}

function DetailRow({ icon, label, value }) {
  return <div className="detail-row"><span className="detail-row-icon">{icon}</span><div><small>{label}</small><strong>{value || "—"}</strong></div></div>;
}

export default App;
