// catalog.js - Smart Catalog Engine for Thai Udon Furniture
// Pattern aligned with ads-modern-luxury-144.warm-goat-0345.chatgpt.site

(function () {
  'use strict';

  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'all';
  let currentSearchQuery = '';
  let activeModalIndex = -1;

  // DOM Elements
  const productGrid = document.getElementById('product-grid');
  const searchInput = document.getElementById('search-input');
  const categoryPillsContainer = document.getElementById('category-pills');
  const resultsCountEl = document.getElementById('results-count');
  const emptyStateEl = document.getElementById('empty-state');

  // Modal Elements
  const previewModal = document.getElementById('preview-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalProductImg = document.getElementById('modal-product-img');
  const modalRefImg = document.getElementById('modal-ref-img');
  const modalFullPageImg = document.getElementById('modal-fullpage-img');
  const modalGraphicView = document.getElementById('modal-view-graphic');
  const modalRefView = document.getElementById('modal-view-ref');
  const modalFullPageView = document.getElementById('modal-view-fullpage');
  const modalCode = document.getElementById('modal-code');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalSize = document.getElementById('modal-size');
  const modalPageNum = document.getElementById('modal-pagenum');
  const modalDownloadGraphicBtn = document.getElementById('modal-download-graphic-btn');
  const modalDownloadRefBtn = document.getElementById('modal-download-ref-btn');
  const modalLineBtn = document.getElementById('modal-line-btn');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const tabGraphic = document.getElementById('tab-graphic');
  const tabRef = document.getElementById('tab-ref');
  const tabFullPage = document.getElementById('tab-fullpage');

  // Initialize
  async function initCatalog() {
    try {
      const response = await fetch('assets/data/tulo_items.json');
      if (!response.ok) {
        throw new Error('Failed to load catalog data');
      }
      allProducts = await response.json();
      filteredProducts = [...allProducts];

      renderCategoryPills();
      renderProducts();
      setupEventListeners();
      checkUrlParams();
    } catch (err) {
      console.error('Error initializing catalog:', err);
      if (productGrid) {
        productGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px;">
            <p style="color: #705E4F; font-size: 18px;">ไม่สามารถโหลดข้อมูลแคตตาล็อกได้ กรุณาลองใหม่อีกครั้ง</p>
          </div>
        `;
      }
    }
  }

  // Render Category Pills
  function renderCategoryPills() {
    if (!categoryPillsContainer) return;

    const counts = { all: allProducts.length };
    allProducts.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    const categories = [
      { id: 'all', name: 'ทั้งหมด', count: counts.all },
      { id: 'ตู้กับข้าว', name: 'ตู้กับข้าว', count: counts['ตู้กับข้าว'] || 0 },
      { id: 'ตู้กับข้าวแผ่นอะลูมิเนียม', name: 'ตู้กับข้าวอะลูมิเนียม', count: counts['ตู้กับข้าวแผ่นอะลูมิเนียม'] || 0 },
      { id: 'ตู้กระเบื้อง & วางเตาแก๊ส', name: 'ตู้กระเบื้อง & เตาแก๊ส', count: counts['ตู้กระเบื้อง & วางเตาแก๊ส'] || 0 },
      { id: 'ตู้ครัวเคาน์เตอร์ทรงสูง', name: 'ตู้ครัวทรงสูง', count: counts['ตู้ครัวเคาน์เตอร์ทรงสูง'] || 0 },
      { id: 'เคาน์เตอร์ครัวท็อปหิน', name: 'เคาน์เตอร์ท็อปหิน', count: counts['เคาน์เตอร์ครัวท็อปหิน'] || 0 },
      { id: 'ตู้ใส่ของ 8 บาน', name: 'ตู้ใส่ของ 8 บาน', count: counts['ตู้ใส่ของ 8 บาน'] || 0 },
      { id: 'ตู้เสื้อผ้า & ตู้ใส่ของ', name: 'ตู้เสื้อผ้า & ตู้โชว์', count: counts['ตู้เสื้อผ้า & ตู้ใส่ของ'] || 0 },
      { id: 'ตู้กับข้าวมินิมอล D-Series', name: 'ตู้กับข้าว D-Series', count: counts['ตู้กับข้าวมินิมอล D-Series'] || 0 },
      { id: 'ตู้เก็บของมินิมอล D-Series', name: 'ตู้เก็บของ D-Series', count: counts['ตู้เก็บของมินิมอล D-Series'] || 0 }
    ];

    categoryPillsContainer.innerHTML = categories.map(cat => `
      <button type="button" 
              class="pill-btn ${cat.id === currentCategory ? 'active' : ''}" 
              data-category="${cat.id}">
        ${cat.name} <span class="pill-count">(${cat.count})</span>
      </button>
    `).join('');

    categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category');
        setCategory(cat);
      });
    });
  }

  // Set Category
  function setCategory(catId) {
    currentCategory = catId;
    if (categoryPillsContainer) {
      categoryPillsContainer.querySelectorAll('.pill-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === catId);
      });
    }
    applyFilter();
  }

  // Apply Filter
  function applyFilter() {
    filteredProducts = allProducts.filter(item => {
      const matchCat = (currentCategory === 'all') || (item.category === currentCategory);
      if (!matchCat) return false;

      if (!currentSearchQuery) return true;

      const q = currentSearchQuery.toLowerCase().trim();
      const codeMatch = item.code.toLowerCase().includes(q);
      const nameMatch = item.name.toLowerCase().includes(q);
      const catMatch = item.category.toLowerCase().includes(q);
      const sizeMatch = item.size ? item.size.toLowerCase().includes(q) : false;
      const tagMatch = item.tags ? item.tags.some(t => t.toLowerCase().includes(q)) : false;

      return codeMatch || nameMatch || catMatch || sizeMatch || tagMatch;
    });

    renderProducts();
  }

  // Render Products (Pattern matching ads-modern-luxury)
  function renderProducts() {
    if (!productGrid) return;

    if (resultsCountEl) {
      resultsCountEl.textContent = `${filteredProducts.length} รหัส · ${filteredProducts.length} ภาพ`;
    }

    if (filteredProducts.length === 0) {
      productGrid.innerHTML = '';
      if (emptyStateEl) emptyStateEl.style.display = 'block';
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = 'none';

    productGrid.innerHTML = filteredProducts.map((item, index) => {
      const lineMsg = encodeURIComponent(`สวัสดีครับ สนใจสั่งซื้อสินค้า [รหัส ${item.code}] ${item.name} (${item.size || ''}) จากเว็บไซต์ไทยอุดรเฟอร์นิเจอร์ ขอทราบรายละเอียดครับ`);
      const lineUrl = `https://line.me/ti/p/~0930494178?text=${lineMsg}`;
      const refCroppedImg = item.ref_cropped || item.ref_image;
      const searchData = `${item.code} ${item.name} ${item.category} ${item.size || ''}`.toLowerCase();

      return `
        <article class="catalog-card" data-search="${escapeHtml(searchData)}">
          <div style="position: relative; width: 100%;">
            <a href="${escapeHtml(item.image)}" class="card-img-link" onclick="event.preventDefault(); window.ThaiUdonCatalog.openModal(${index}, 'graphic');" title="คลิกเพื่อดูภาพขยาย">
              <img loading="lazy" width="480" height="480" src="${escapeHtml(item.image)}" alt="${escapeHtml(item.code)} ${escapeHtml(item.name)}" onerror="this.src='assets/images/logo/logo-red.png'">
              <div class="card-hover-hint">
                <span class="card-hover-pill">🔍 ดูภาพขยาย</span>
              </div>
            </a>
          </div>

          <div class="card-body">
            <h2>${escapeHtml(item.code)}</h2>
            <p class="title">${escapeHtml(item.name)}</p>
            <p class="size">ขนาด: ${escapeHtml(item.size || 'ขนาดมาตรฐาน')}</p>
            <small>แคตตาล็อกหน้า ${item.ref_page || 1}</small>

            <nav>
              <a href="${escapeHtml(item.image)}" class="download-png" onclick="event.preventDefault(); window.ThaiUdonCatalog.downloadFile('${escapeHtml(item.image)}', '${escapeHtml(item.filename)}');">
                ดาวน์โหลด PNG
              </a>
              <a href="${escapeHtml(refCroppedImg)}" class="view-reference" target="_blank" onclick="event.preventDefault(); window.ThaiUdonCatalog.openModal(${index}, 'ref');">
                📸 ภาพอ้างอิง
              </a>
              <a href="${lineUrl}" class="order-line" target="_blank" rel="noopener noreferrer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.06-.17.6-.61 2.22-.7 2.56-.11.43.16.42.34.3 1.45-.96 3.4-2.28 3.8-2.55.87.24 1.78.37 2.72.37 5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg>
                สั่งซื้อ Line : 0930494178
              </a>
            </nav>
          </div>
        </article>
      `;
    }).join('');
  }

  // Open Preview Modal
  function openModal(index, initialTab = 'graphic') {
    if (index < 0 || index >= filteredProducts.length) return;
    activeModalIndex = index;
    const item = filteredProducts[index];

    if (!previewModal) return;

    if (modalCode) modalCode.textContent = item.code;
    if (modalTitle) modalTitle.textContent = item.name;
    if (modalCategory) modalCategory.textContent = item.category;
    if (modalSize) modalSize.textContent = item.size || 'ขนาดมาตรฐาน';
    if (modalPageNum) modalPageNum.textContent = `แคตตาล็อกหน้า ${item.ref_page || 1}`;

    // Graphic Image
    if (modalProductImg) {
      modalProductImg.src = item.image;
      modalProductImg.alt = `${item.code} ${item.name}`;
    }

    // Cropped Reference Image
    const croppedRef = item.ref_cropped || item.ref_image;
    if (modalRefImg) {
      modalRefImg.src = croppedRef;
      modalRefImg.alt = `ภาพอ้างอิงเฉพาะรุ่น ${item.code}`;
    }

    // Switch to initial tab
    switchModalTab(initialTab);

    // Setup Download Graphic Button
    if (modalDownloadGraphicBtn) {
      modalDownloadGraphicBtn.onclick = () => downloadFile(item.image, item.filename);
    }

    // Setup Download Ref Button
    if (modalDownloadRefBtn) {
      const refFilename = `${item.code}_ref.png`;
      modalDownloadRefBtn.onclick = () => downloadFile(croppedRef, refFilename);
    }

    // Setup LINE Link
    if (modalLineBtn) {
      const lineMsg = encodeURIComponent(`สวัสดีครับ สนใจสั่งซื้อสินค้า [รหัส ${item.code}] ${item.name} (${item.size || ''}) จากเว็บไซต์ไทยอุดรเฟอร์นิเจอร์ ขอทราบรายละเอียดครับ`);
      modalLineBtn.href = `https://line.me/ti/p/~0930494178?text=${lineMsg}`;
    }

    // Show Modal
    previewModal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  // Switch Modal Tab (graphic, ref)
  function switchModalTab(tab) {
    if (modalGraphicView) modalGraphicView.style.display = (tab === 'graphic') ? 'flex' : 'none';
    if (modalRefView) modalRefView.style.display = (tab === 'ref') ? 'flex' : 'none';

    if (tabGraphic) tabGraphic.classList.toggle('active', tab === 'graphic');
    if (tabRef) tabRef.classList.toggle('active', tab === 'ref');

    // Update direct external link
    const extLink = document.getElementById('modal-external-link');
    if (extLink && activeModalIndex >= 0 && activeModalIndex < filteredProducts.length) {
      const item = filteredProducts[activeModalIndex];
      const refCroppedImg = item.ref_cropped || item.ref_image;
      extLink.href = (tab === 'ref') ? refCroppedImg : item.image;
      extLink.textContent = (tab === 'ref') ? '🔗 เปิดภาพอ้างอิงขนาดเต็มในแท็บใหม่' : '🔗 เปิดภาพกราฟิกขนาดเต็มในแท็บใหม่';
    }
  }

  // Close Modal
  function closeModal() {
    if (!previewModal) return;
    previewModal.classList.remove('show');
    document.body.style.overflow = '';
  }

  // Navigate Modal (Prev / Next)
  function navigateModal(direction) {
    let newIndex = activeModalIndex + direction;
    if (newIndex < 0) newIndex = filteredProducts.length - 1;
    if (newIndex >= filteredProducts.length) newIndex = 0;
    const currentTab = (tabRef && tabRef.classList.contains('active')) ? 'ref' : 'graphic';
    openModal(newIndex, currentTab);
  }

  // Download File Utility
  function downloadFile(url, filename) {
    const safeName = filename || url.substring(url.lastIndexOf('/') + 1) || 'thaiudon-product.png';

    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Network error');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = blobUrl;
        a.download = safeName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        showToast(`บันทึกไฟล์ "${safeName}" เรียบร้อยแล้ว`);
      })
      .catch(() => {
        const a = document.createElement('a');
        a.href = url;
        a.download = safeName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast(`กำลังเปิดดาวน์โหลดไฟล์ "${safeName}"`);
      });
  }

  // Toast
  function showToast(message) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        applyFilter();
      });
    }

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    if (previewModal) {
      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closeModal();
      });
    }

    if (tabGraphic) tabGraphic.addEventListener('click', () => switchModalTab('graphic'));
    if (tabRef) tabRef.addEventListener('click', () => switchModalTab('ref'));
    if (tabFullPage) tabFullPage.addEventListener('click', () => switchModalTab('fullpage'));

    if (modalPrevBtn) {
      modalPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(-1);
      });
    }
    if (modalNextBtn) {
      modalNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        navigateModal(1);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (!previewModal || !previewModal.classList.contains('show')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') navigateModal(-1);
      if (e.key === 'ArrowRight') navigateModal(1);
    });
  }

  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const q = params.get('search');

    if (q && searchInput) {
      searchInput.value = q;
      currentSearchQuery = q;
    }

    if (cat) {
      setCategory(cat);
    } else if (q) {
      applyFilter();
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.ThaiUdonCatalog = {
    init: initCatalog,
    openModal: openModal,
    closeModal: closeModal,
    navigateModal: navigateModal,
    switchModalTab: switchModalTab,
    downloadFile: downloadFile,
    setCategory: setCategory,
    showToast: showToast
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCatalog);
  } else {
    initCatalog();
  }
})();
