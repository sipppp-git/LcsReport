document.addEventListener("DOMContentLoaded", function () {
    const tbodyEviden = document.getElementById("tbodyEviden");
    const btnTambahBaris = document.getElementById("btnTambahBaris");
    const formLaporan = document.getElementById("formLaporan");
    
    // Element Tampilan (Views)
    const mainView = document.getElementById("main-view");
    const previewView = document.getElementById("preview-view");

    // Tombol-tombol
    const btnPreview = document.getElementById("btnPreview");
    const btnKembali = document.getElementById("btnKembali");
    const btnCetak = document.getElementById("btnCetak");
    const btnCetakPreview = document.getElementById("btnCetakPreview");

    // FUNGSI: Update Nomor Urut Tabel Input
    function updateNomorUrut() {
        const baris = tbodyEviden.querySelectorAll("tr");
        baris.forEach((tr, index) => {
            tr.querySelector(".nomor-urut").innerText = index + 1;
            const btnHapus = tr.querySelector(".btn-hapus");
            // Nonaktifkan tombol hapus jika tersisa 1 baris
            btnHapus.disabled = baris.length === 1;
        });
    }

    // FUNGSI: Tambah Baris Baru di Form Input
    btnTambahBaris.addEventListener("click", function () {
        const barisBaru = document.createElement("tr");
        barisBaru.innerHTML = `
            <td class="nomor-urut text-center"></td>
            <td><input type="date" class="form-control input-tanggal" required></td>
            <td><textarea class="form-control input-materi" rows="3" placeholder="Masukkan materi..." required></textarea></td>
            <td><input type="file" class="form-control input-like" accept="image/png, image/jpeg, image/jpg" required></td>
            <td><input type="file" class="form-control input-comment" accept="image/png, image/jpeg, image/jpg" required></td>
            <td><input type="file" class="form-control input-share" accept="image/png, image/jpeg, image/jpg" required></td>
            <td class="text-center">
                <button type="button" class="btn btn-danger btn-sm btn-hapus"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbodyEviden.appendChild(barisBaru);
        updateNomorUrut();
    });

    // FUNGSI: Hapus Baris di Form Input
    tbodyEviden.addEventListener("click", function (e) {
        if (e.target.closest(".btn-hapus")) {
            e.target.closest("tr").remove();
            updateNomorUrut();
        }
    });

    // FUNGSI BANTUAN: Konversi File Gambar menjadi format Base64 agar bisa dirender
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve("");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    // FUNGSI UTAMA 1: Mengambil data dari form dan memasukkannya ke template Kertas Preview
    async function siapkanDataPDF() {
        // 1. Ambil & Masukkan Data Diri
        const nama = document.getElementById("inputNama").value;
        document.getElementById("pdfNama").innerText = nama;
        document.getElementById("pdfNIP").innerText = document.getElementById("inputNIP").value;
        document.getElementById("pdfKab").innerText = document.getElementById("inputKab").value;

        // 2. Ambil & Masukkan Data Tabel
        const pdfTbody = document.getElementById("pdfTbodyEviden");
        pdfTbody.innerHTML = ""; // Bersihkan data sebelumnya jika ada

        const barisTabel = tbodyEviden.querySelectorAll("tr");
        
        for (let i = 0; i < barisTabel.length; i++) {
            const tr = barisTabel[i];
            const tanggal = tr.querySelector(".input-tanggal").value;
            const materi = tr.querySelector(".input-materi").value;
            
            // Ambil file gambar
            const fileLike = tr.querySelector(".input-like").files[0];
            const fileComment = tr.querySelector(".input-comment").files[0];
            const fileShare = tr.querySelector(".input-share").files[0];

            // Proses gambar (tunggu hingga selesai di-convert)
            const base64Like = await fileToBase64(fileLike);
            const base64Comment = await fileToBase64(fileComment);
            const base64Share = await fileToBase64(fileShare);

            // Susun tag IMG HTML (jika gambar ada)
            const imgLikeHtml = base64Like ? `<img src="${base64Like}" class="pdf-img">` : '';
            const imgCommentHtml = base64Comment ? `<img src="${base64Comment}" class="pdf-img">` : '';
            const imgShareHtml = base64Share ? `<img src="${base64Share}" class="pdf-img">` : '';

            // Format tanggal agar rapi (DD-MM-YYYY)
            let formatTanggal = "";
            if (tanggal) {
                const d = new Date(tanggal);
                formatTanggal = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;
            }

            // Buat baris untuk tabel di kertas PDF
            const trPdf = document.createElement("tr");
            trPdf.innerHTML = `
                <td align="center">${i + 1}</td>
                <td align="center">${formatTanggal}</td>
                <td style="white-space: pre-line;">${materi}</td>
                <td align="center">${imgLikeHtml}</td>
                <td align="center">${imgCommentHtml}</td>
                <td align="center">${imgShareHtml}</td>
            `;
            pdfTbody.appendChild(trPdf);
        }
    }

    // FUNGSI UTAMA 2: Eksekusi rendering dari HTML menjadi File PDF sungguhan
    function eksekusiCetakPDF() {
        const elemenKertas = document.getElementById("printable-area");
        const nama = document.getElementById("inputNama").value || "TanpaNama";
        
        // KONFIGURASI PDF (Di sini kita cegah terpotongnya tabel)
        const opt = {
            // Margin [Atas, Kanan, Bawah, Kiri] dalam milimeter
            margin:       [15, 10, 15, 10], 
            filename:     `Laporan_Penyuluhan_${nama.replace(/\s+/g, '_')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2,           // Resolusi tinggi
                useCORS: true,      // Mengizinkan render gambar eksternal/base64
                scrollY: 0          // Memastikan screenshot dimulai dari titik teratas
            },
            jsPDF:        { 
                unit: 'mm', 
                format: 'a4', 
                orientation: 'landscape' 
            },
            // FITUR PENTING: Mencegah baris tabel terpotong separuh saat pindah halaman
            pagebreak:    { mode: 'avoid-all' } 
        };

        html2pdf().set(opt).from(elemenKertas).save();
    }

    // ==========================================
    // LOGIK TOMBOL-TOMBOL (EVENT LISTENERS)
    // ==========================================

    // 1. Aksi Tombol Preview
    btnPreview.addEventListener("click", async function () {
        // Validasi HTML5: Pastikan semua form dan file gambar sudah diisi
        if (!formLaporan.checkValidity()) {
            formLaporan.reportValidity();
            return;
        }
        
        // Ubah status tombol jadi loading
        btnPreview.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Loading...';
        btnPreview.disabled = true;

        // Tunggu proses merangkai data PDF selesai
        await siapkanDataPDF();
        
        // Sembunyikan form, munculkan kertas preview
        mainView.style.display = "none";
        previewView.style.display = "block";
        
        // Kembalikan status tombol preview
        btnPreview.innerHTML = '<i class="bi bi-eye"></i> Preview';
        btnPreview.disabled = false;
    });

    // 2. Aksi Tombol Kembali Edit (Di Halaman Preview)
    btnKembali.addEventListener("click", function () {
        previewView.style.display = "none";
        mainView.style.display = "block";
    });

    // 3. Aksi Tombol Cetak Langsung (Submit Form)
    formLaporan.addEventListener("submit", async function (e) {
        e.preventDefault(); // Cegah reload halaman
        
        // Ubah status tombol
        btnCetak.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';
        btnCetak.disabled = true;

        await siapkanDataPDF();
        eksekusiCetakPDF();
        
        // Kembalikan status tombol
        btnCetak.innerHTML = '<i class="bi bi-printer"></i> Cetak Langsung';
        btnCetak.disabled = false;
    });

    // 4. Aksi Tombol Cetak dari Halaman Preview (Pojok Kanan Atas)
    btnCetakPreview.addEventListener("click", function () {
        // Langsung cetak karena datanya sudah disiapkan saat masuk mode preview
        eksekusiCetakPDF();
    });

});