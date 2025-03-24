document.addEventListener("DOMContentLoaded", function() {
  // Tabváltás kezelése
  const adminTabs = document.querySelectorAll("#adminTabs .nav-link");
  const tabContent = document.getElementById("tabContent");

  adminTabs.forEach(tab => {
    tab.addEventListener("click", function(e) {
      e.preventDefault();
      adminTabs.forEach(t => t.classList.remove("active"));
      this.classList.add("active");
      const tabName = this.getAttribute("data-tab");
      if (tabName === "users") {
        loadUsers();
      } else if (tabName === "cipok") {
        loadCipok();
      } else if (tabName === "exkluziv") {
        loadExkluziv();
      }
    });
  });

  // Alapértelmezett tartalom: Felhasználók listája
  loadUsers();

  // ---------------------------
  // FELHASZNÁLÓK kezelése
  // ---------------------------
  async function loadUsers() {
    try {
      const res = await fetch("/api/felhasznalok");
      const users = await res.json();
      renderUsers(users);
    } catch (err) {
      console.error("Hiba felhasználók betöltésekor:", err);
      tabContent.innerHTML = "<p>Hiba a felhasználók betöltésekor.</p>";
    }
  }

  function renderUsers(users) {
    let html = `
      <h2>Felhasználók</h2>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Vezetéknév</th>
            <th>Keresztnév</th>
            <th>Email</th>
            <th>Szerep</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
    `;
    users.forEach(user => {
      html += `
        <tr>
          <td>${user.felhasznalo_id}</td>
          <td>${user.vezeteknev}</td>
          <td>${user.keresztnev}</td>
          <td>${user.email}</td>
          <td>${user.szerep}</td>
          <td>
            <button class="btn btn-sm btn-primary action-btn" onclick="editUser(${user.felhasznalo_id})">Szerkesztés</button>
            <button class="btn btn-sm btn-danger action-btn" onclick="deleteUser(${user.felhasznalo_id})">Törlés</button>
          </td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <h3>Új felhasználó hozzáadása</h3>
      <form id="addUserForm">
        <div class="mb-2">
          <input type="text" class="form-control" id="newVezeteknev" placeholder="Vezetéknév" required>
        </div>
        <div class="mb-2">
          <input type="text" class="form-control" id="newKeresztnev" placeholder="Keresztnév" required>
        </div>
        <div class="mb-2">
          <input type="email" class="form-control" id="newEmail" placeholder="Email" required>
        </div>
        <div class="mb-2">
          <input type="password" class="form-control" id="newJelszo" placeholder="Jelszó" required>
        </div>
        <div class="mb-2">
          <select class="form-select" id="newSzerep">
            <option value="Vásárló">Vásárló</option>
            <option value="Adminisztrátor">Adminisztrátor</option>
            <option value="Raktáros">Raktáros</option>
            <option value="Bolti eladó">Bolti eladó</option>
          </select>
        </div>
        <button type="submit" class="btn btn-success">Hozzáadás</button>
      </form>
      <div id="editUserContainer" style="display:none;">
        <h3>Felhasználó szerkesztése</h3>
        <form id="editUserForm">
          <input type="hidden" id="editUserId">
          <div class="mb-2">
            <input type="text" class="form-control" id="editVezeteknev" placeholder="Vezetéknév" required>
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="editKeresztnev" placeholder="Keresztnév" required>
          </div>
          <div class="mb-2">
            <input type="email" class="form-control" id="editEmail" placeholder="Email" required>
          </div>
          <div class="mb-2">
            <select class="form-select" id="editSzerep">
              <option value="Vásárló">Vásárló</option>
              <option value="Adminisztrátor">Adminisztrátor</option>
              <option value="Raktáros">Raktáros</option>
              <option value="Bolti eladó">Bolti eladó</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Mentés</button>
          <button type="button" class="btn btn-secondary" onclick="cancelEditUser()">Mégse</button>
        </form>
      </div>
    `;
    tabContent.innerHTML = html;
    document.getElementById("addUserForm").addEventListener("submit", addUser);
    document.getElementById("editUserForm").addEventListener("submit", updateUser);
  }

  async function addUser(e) {
    e.preventDefault();
    const vezeteknev = document.getElementById("newVezeteknev").value;
    const keresztnev = document.getElementById("newKeresztnev").value;
    const email = document.getElementById("newEmail").value;
    const jelszo_hash = document.getElementById("newJelszo").value;
    const szerep = document.getElementById("newSzerep").value;
    try {
      const res = await fetch("/api/felhasznalok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vezeteknev, keresztnev, felhasznalonev: email, email, jelszo_hash })
      });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert("Hiba a felhasználó hozzáadásakor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a felhasználó hozzáadásakor");
    }
  }

  window.editUser = async function(userId) {
    try {
      const res = await fetch(`/api/felhasznalok/${userId}`);
      const user = await res.json();
      document.getElementById("editUserId").value = user.felhasznalo_id;
      document.getElementById("editVezeteknev").value = user.vezeteknev;
      document.getElementById("editKeresztnev").value = user.keresztnev;
      document.getElementById("editEmail").value = user.email;
      document.getElementById("editSzerep").value = user.szerep;
      document.getElementById("editUserContainer").style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Hiba történt a felhasználó betöltésekor");
    }
  };

  window.cancelEditUser = function() {
    document.getElementById("editUserContainer").style.display = "none";
  };

  async function updateUser(e) {
    e.preventDefault();
    const userId = document.getElementById("editUserId").value;
    const vezeteknev = document.getElementById("editVezeteknev").value;
    const keresztnev = document.getElementById("editKeresztnev").value;
    const email = document.getElementById("editEmail").value;
    const szerep = document.getElementById("editSzerep").value;
    try {
      const res = await fetch(`/api/felhasznalok/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vezeteknev, keresztnev, email, szerep })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("editUserContainer").style.display = "none";
        loadUsers();
      } else {
        alert("Hiba a felhasználó frissítésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a felhasználó frissítésekor");
    }
  }

  window.deleteUser = async function(userId) {
    if (!confirm("Biztosan törlöd a felhasználót?")) return;
    try {
      const res = await fetch(`/api/felhasznalok/${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadUsers();
      } else {
        alert("Hiba a felhasználó törlésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a felhasználó törlésekor");
    }
  };

  // ---------------------------
  // CIPŐK (normál cipők) kezelése
  // ---------------------------
  async function loadCipok() {
    try {
      const res = await fetch("/api/cipok");
      const cipok = await res.json();
      renderCipok(cipok);
    } catch (err) {
      console.error("Hiba a cipők betöltésekor:", err);
      tabContent.innerHTML = "<p>Hiba a cipők betöltésekor.</p>";
    }
  }

  function renderCipok(cipok) {
    let html = `
      <h2>Normál Cipők</h2>
      <button class="btn btn-success mb-3" id="addCipoBtn">Új cipő hozzáadása</button>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Képek</th>
            <th>Márka</th>
            <th>Modell</th>
            <th>Ár</th>
            <th>Leírás</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
    `;
    cipok.forEach(cipo => {
      html += `
        <tr>
          <td>${cipo.cipo_id}</td>
          <td>
            ${Array.isArray(cipo.image_urls)
              ? cipo.image_urls.map(url => url ? `<img src="${url}" alt="Cipő kép" style="height:50px; margin-right:5px;">` : "").join("")
              : ""}
          </td>
          <td>${cipo.marka}</td>
          <td>${cipo.modell}</td>
          <td>${Number(cipo.ar).toLocaleString("hu-HU")} Ft</td>
          <td>${cipo.leiras.substring(0, 50)}...</td>
          <td>
            <button class="btn btn-sm btn-primary action-btn" onclick="editCipo(${cipo.cipo_id})">Szerkesztés</button>
            <button class="btn btn-sm btn-danger action-btn" onclick="deleteCipo(${cipo.cipo_id})">Törlés</button>
          </td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div id="addCipoContainer" style="display:none;">
        <h3>Új cipő hozzáadása</h3>
        <form id="addCipoForm">
          <div class="mb-2">
            <input type="text" class="form-control" id="newMarka" placeholder="Márka" required>
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="newModell" placeholder="Modell" required>
          </div>
          <div class="mb-2">
            <input type="number" class="form-control" id="newAr" placeholder="Ár" required>
          </div>
          <div class="mb-2">
            <textarea class="form-control" id="newLeiras" placeholder="Leírás" required></textarea>
          </div>
          <!-- Három külön input a kép URL-ekhez -->
          <div class="mb-2">
            <input type="text" class="form-control" id="newImageUrl1" placeholder="Kép URL 1 (pl. https://domain.hu/kep1.jpg)">
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="newImageUrl2" placeholder="Kép URL 2 (pl. https://domain.hu/kep2.jpg)">
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="newImageUrl3" placeholder="Kép URL 3 (pl. https://domain.hu/kep3.jpg)">
          </div>
          <button type="submit" class="btn btn-success">Hozzáadás</button>
          <button type="button" class="btn btn-secondary" onclick="cancelAddCipo()">Mégse</button>
        </form>
      </div>
      <div id="editCipoContainer" style="display:none;">
        <h3>Cipő szerkesztése</h3>
        <form id="editCipoForm">
          <input type="hidden" id="editCipoId">
          <div class="mb-2">
            <input type="text" class="form-control" id="editMarka" placeholder="Márka" required>
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="editModell" placeholder="Modell" required>
          </div>
          <div class="mb-2">
            <input type="number" class="form-control" id="editAr" placeholder="Ár" required>
          </div>
          <div class="mb-2">
            <textarea class="form-control" id="editLeiras" placeholder="Leírás" required></textarea>
          </div>
          <!-- Három input a kép URL-ek szerkesztéséhez -->
          <div class="mb-2">
            <input type="text" class="form-control" id="editImageUrl1" placeholder="Kép URL 1 (pl. https://domain.hu/kep1.jpg)">
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="editImageUrl2" placeholder="Kép URL 2 (pl. https://domain.hu/kep2.jpg)">
          </div>
          <div class="mb-2">
            <input type="text" class="form-control" id="editImageUrl3" placeholder="Kép URL 3 (pl. https://domain.hu/kep3.jpg)">
          </div>
          <button type="submit" class="btn btn-primary">Mentés</button>
          <button type="button" class="btn btn-secondary" onclick="cancelEditCipo()">Mégse</button>
        </form>
      </div>
    `;
    tabContent.innerHTML = html;

    // Azonosítók hozzárendelése a sorokhoz
    const rows = document.querySelectorAll("#tabContent table tbody tr");
    rows.forEach(row => {
      const firstCell = row.querySelector("td");
      if (firstCell) {
        const cipoId = firstCell.textContent.trim();
        row.id = `cipo-${cipoId}`;
      }
    });

    document.getElementById("addCipoBtn").addEventListener("click", function() {
      document.getElementById("addCipoContainer").style.display = "block";
    });
    document.getElementById("addCipoForm").addEventListener("submit", addCipo);
    document.getElementById("editCipoForm").addEventListener("submit", updateCipo);
  }

  async function addCipo(e) {
    e.preventDefault();
    const marka = document.getElementById("newMarka").value;
    const modell = document.getElementById("newModell").value;
    const ar = document.getElementById("newAr").value;
    const leiras = document.getElementById("newLeiras").value;
    const imageUrl1 = document.getElementById("newImageUrl1").value;
    const imageUrl2 = document.getElementById("newImageUrl2").value;
    const imageUrl3 = document.getElementById("newImageUrl3").value;
    // Csak azokat az URL-eket küldjük el, amelyek nem üresek
    const image_urls = [imageUrl1, imageUrl2, imageUrl3].filter(url => url.trim() !== "");
    try {
      const res = await fetch("/api/cipok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marka, modell, ar, leiras, image_urls })
      });
      const data = await res.json();
      if (data.success) {
        loadCipok();
      } else {
        alert("Hiba a cipő hozzáadásakor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a cipő hozzáadásakor");
    }
  }

  async function editCipo(cipoId) {
    try {
      const res = await fetch(`/api/cipok/${cipoId}`);
      const cipo = await res.json();
      document.getElementById("editCipoId").value = cipo.cipo_id;
      document.getElementById("editMarka").value = cipo.marka;
      document.getElementById("editModell").value = cipo.modell;
      document.getElementById("editAr").value = cipo.ar;
      document.getElementById("editLeiras").value = cipo.leiras;
      // Ha az adatbázisból tömbként jönnek az URL-ek, feltöltjük a három mezőt
      document.getElementById("editImageUrl1").value = cipo.image_urls && cipo.image_urls[0] ? cipo.image_urls[0] : "";
      document.getElementById("editImageUrl2").value = cipo.image_urls && cipo.image_urls[1] ? cipo.image_urls[1] : "";
      document.getElementById("editImageUrl3").value = cipo.image_urls && cipo.image_urls[2] ? cipo.image_urls[2] : "";
      document.getElementById("editCipoContainer").style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Hiba a cipő betöltésekor");
    }
  }

  async function updateCipo(e) {
    e.preventDefault();
    const cipoId = document.getElementById("editCipoId").value;
    const marka = document.getElementById("editMarka").value;
    const modell = document.getElementById("editModell").value;
    const ar = document.getElementById("editAr").value;
    const leiras = document.getElementById("editLeiras").value;
    const imageUrl1 = document.getElementById("editImageUrl1").value;
    const imageUrl2 = document.getElementById("editImageUrl2").value;
    const imageUrl3 = document.getElementById("editImageUrl3").value;
    const image_urls = [imageUrl1, imageUrl2, imageUrl3].filter(url => url.trim() !== "");
    try {
      const res = await fetch(`/api/cipok/${cipoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marka, modell, ar, leiras, image_urls })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("editCipoContainer").style.display = "none";
        loadCipok();
      } else {
        alert("Hiba a cipő frissítésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a cipő frissítésekor");
    }
  }

  async function deleteCipo(cipoId) {
    if (!confirm("Biztosan törlöd a cipőt?")) return;
    try {
      const res = await fetch(`/api/cipok/${cipoId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const row = document.getElementById(`cipo-${cipoId}`);
        if (row) {
          row.remove();
        } else {
          loadCipok();
        }
      } else {
        alert("Hiba a cipő törlésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt a cipő törlésekor");
    }
  }

  function cancelAddCipo() {
    document.getElementById("addCipoContainer").style.display = "none";
  }

  function cancelEditCipo() {
    document.getElementById("editCipoContainer").style.display = "none";
  }

  // ---------------------------
  // EXKLUZÍV CIPŐK kezelése
  // ---------------------------
  async function loadExkluziv() {
    try {
      const res = await fetch("/api/exkluziv_cipok");
      const exkluziv = await res.json();
      renderExkluziv(exkluziv);
    } catch (err) {
      console.error("Hiba az exkluzív cipők betöltésekor:", err);
      tabContent.innerHTML = "<p>Hiba az exkluzív cipők betöltésekor.</p>";
    }
  }

  function renderExkluziv(exkluziv) {
    let html = `
      <h2>Exkluzív Cipők</h2>
      <button class="btn btn-success mb-3" id="addExkluzivBtn">Új exkluzív cipő hozzáadása</button>
      <table class="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>Márka</th>
            <th>Modell</th>
            <th>Ár</th>
            <th>Leírás</th>
            <th>Műveletek</th>
          </tr>
        </thead>
        <tbody>
    `;
    exkluziv.forEach(cipo => {
      html += `
        <tr>
          <td>${cipo.exkluziv_id}</td>
          <td>${cipo.marka}</td>
          <td>${cipo.modell}</td>
          <td>${Number(cipo.ar).toLocaleString("hu-HU")} Ft</td>
          <td>${cipo.leiras.substring(0,50)}...</td>
          <td>
            <button class="btn btn-sm btn-primary action-btn" onclick="editExkluziv(${cipo.exkluziv_id})">Szerkesztés</button>
            <button class="btn btn-sm btn-danger action-btn" onclick="deleteExkluziv(${cipo.exkluziv_id})">Törlés</button>
          </td>
        </tr>
      `;
    });
    html += `
        </tbody>
      </table>
      <div id="addExkluzivContainer" style="display:none;">
        <h3>Új exkluzív cipő hozzáadása</h3>
        <form id="addExkluzivForm">
          <div class="mb-2"><input type="text" class="form-control" id="newExMarka" placeholder="Márka" required></div>
          <div class="mb-2"><input type="text" class="form-control" id="newExModell" placeholder="Modell" required></div>
          <div class="mb-2"><input type="number" class="form-control" id="newExAr" placeholder="Ár" required></div>
          <div class="mb-2"><textarea class="form-control" id="newExLeiras" placeholder="Leírás" required></textarea></div>
          <button type="submit" class="btn btn-success">Hozzáadás</button>
          <button type="button" class="btn btn-secondary" onclick="cancelAddExkluziv()">Mégse</button>
        </form>
      </div>
      <div id="editExkluzivContainer" style="display:none;">
        <h3>Exkluzív cipő szerkesztése</h3>
        <form id="editExkluzivForm">
          <input type="hidden" id="editExId">
          <div class="mb-2"><input type="text" class="form-control" id="editExMarka" placeholder="Márka" required></div>
          <div class="mb-2"><input type="text" class="form-control" id="editExModell" placeholder="Modell" required></div>
          <div class="mb-2"><input type="number" class="form-control" id="editExAr" placeholder="Ár" required></div>
          <div class="mb-2"><textarea class="form-control" id="editExLeiras" placeholder="Leírás" required></textarea></div>
          <button type="submit" class="btn btn-primary">Mentés</button>
          <button type="button" class="btn btn-secondary" onclick="cancelEditExkluziv()">Mégse</button>
        </form>
      </div>
    `;
    tabContent.innerHTML = html;

    const rows = document.querySelectorAll("#tabContent table tbody tr");
    rows.forEach(row => {
      const firstCell = row.querySelector("td");
      if (firstCell) {
        const exId = firstCell.textContent.trim();
        row.id = `exkluziv-${exId}`;
      }
    });

    document.getElementById("addExkluzivBtn").addEventListener("click", function() {
      document.getElementById("addExkluzivContainer").style.display = "block";
    });
    document.getElementById("addExkluzivForm").addEventListener("submit", addExkluziv);
    document.getElementById("editExkluzivForm").addEventListener("submit", updateExkluziv);
  }

  async function addExkluziv(e) {
    e.preventDefault();
    const marka = document.getElementById("newExMarka").value;
    const modell = document.getElementById("newExModell").value;
    const ar = document.getElementById("newExAr").value;
    const leiras = document.getElementById("newExLeiras").value;
    try {
      const res = await fetch("/api/exkluziv_cipok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marka, modell, ar, leiras })
      });
      const data = await res.json();
      if (data.success) {
        loadExkluziv();
      } else {
        alert("Hiba az exkluzív cipő hozzáadásakor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt az exkluzív cipő hozzáadásakor");
    }
  }

  async function editExkluziv(exId) {
    try {
      const res = await fetch(`/api/exkluziv_cipok/${exId}`);
      const ex = await res.json();
      document.getElementById("editExId").value = ex.exkluziv_id;
      document.getElementById("editExMarka").value = ex.marka;
      document.getElementById("editExModell").value = ex.modell;
      document.getElementById("editExAr").value = ex.ar;
      document.getElementById("editExLeiras").value = ex.leiras;
      document.getElementById("editExkluzivContainer").style.display = "block";
    } catch (err) {
      console.error(err);
      alert("Hiba az exkluzív cipő betöltésekor");
    }
  }

  async function updateExkluziv(e) {
    e.preventDefault();
    const exId = document.getElementById("editExId").value;
    const marka = document.getElementById("editExMarka").value;
    const modell = document.getElementById("editExModell").value;
    const ar = document.getElementById("editExAr").value;
    const leiras = document.getElementById("editExLeiras").value;
    try {
      const res = await fetch(`/api/exkluziv_cipok/${exId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marka, modell, ar, leiras })
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById("editExkluzivContainer").style.display = "none";
        loadExkluziv();
      } else {
        alert("Hiba az exkluzív cipő frissítésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt az exkluzív cipő frissítésekor");
    }
  }

  async function deleteExkluziv(exId) {
    if (!confirm("Biztosan törlöd az exkluzív cipőt?")) return;
    try {
      const res = await fetch(`/api/exkluziv_cipok/${exId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        const row = document.getElementById(`exkluziv-${exId}`);
        if (row) {
          row.remove();
        } else {
          loadExkluziv();
        }
      } else {
        alert("Hiba az exkluzív cipő törlésekor");
      }
    } catch (err) {
      console.error(err);
      alert("Hiba történt az exkluzív cipő törlésekor");
    }
  }

  function cancelAddExkluziv() {
    document.getElementById("addExkluzivContainer").style.display = "none";
  }

  function cancelEditExkluziv() {
    document.getElementById("editExkluzivContainer").style.display = "none";
  }

  // Globális elérés biztosítása a normál és exkluzív cipők szerkesztése, törlése funkciókhoz
  window.editCipo = editCipo;
  window.deleteCipo = deleteCipo;
  window.editExkluziv = editExkluziv;
  window.deleteExkluziv = deleteExkluziv;
});
