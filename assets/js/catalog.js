// catalog.js - HomePro-style E-Commerce Catalog Engine for Thai Udon Furniture
// 121 Items Catalog with Multi-Facet Filters, Search, Sorting, and Mobile Drawer

(function () {
  'use strict';

  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'all';
  let currentSize = 'all';
  let currentSort = 'popular';
  let currentSearch = '';
  let onlyRefPhoto = false;
  let activeModalIndex = -1;

  // DOM Elements
  const productGrid = document.getElementById('product-grid');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const sortSelect = document.getElementById('sort-select');
  const mobileSortSelect = document.getElementById('mobile-sort-select');
  const resultsCountEl = document.getElementById('results-count');
  const emptyStateEl = document.getElementById('empty-state');
  const emptyResetBtn = document.getElementById('empty-reset-btn');
  const activeTagsWrap = document.getElementById('active-tags-wrap');
  const categoryCarousel = document.getElementById('category-carousel');
  const sidebarCategories = document.getElementById('sidebar-categories');
  const drawerCategories = document.getElementById('drawer-categories');
  const sidebarResetBtn = document.getElementById('sidebar-reset-btn');
  const filterRefPhotoCheckbox = document.getElementById('filter-ref-photo');
  const drawerFilterRefPhoto = document.getElementById('drawer-filter-ref-photo');

  // Mobile Drawer Elements
  const mobileFilterOpenBtn = document.getElementById('mobile-filter-open-btn');
  const mobileFilterBadge = document.getElementById('mobile-filter-badge');
  const filterDrawer = document.getElementById('filter-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const drawerCloseBtn = document.getElementById('drawer-close-btn');
  const drawerApplyBtn = document.getElementById('drawer-apply-btn');
  const drawerResetBtn = document.getElementById('drawer-reset-btn');
  const drawerBtnCount = document.getElementById('drawer-btn-count');

  // Modal Elements
  const previewModal = document.getElementById('preview-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalProductImg = document.getElementById('modal-product-img');
  const modalRefImg = document.getElementById('modal-ref-img');
  const modalGraphicView = document.getElementById('modal-view-graphic');
  const modalRefView = document.getElementById('modal-view-ref');
  const modalCode = document.getElementById('modal-code');
  const modalTitle = document.getElementById('modal-title');
  const modalCategory = document.getElementById('modal-category');
  const modalSize = document.getElementById('modal-size');
  const modalPageNum = document.getElementById('modal-pagenum');
  const modalDownloadGraphicBtn = document.getElementById('modal-download-graphic-btn');
  const modalDownloadRefBtn = document.getElementById('modal-download-ref-btn');
  const modalLineBtn = document.getElementById('modal-line-btn');
  const modalExternalLink = document.getElementById('modal-external-link');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const tabGraphic = document.getElementById('tab-graphic');
  const tabRef = document.getElementById('tab-ref');

  // Parse Width Helper
  function getProductWidth(item) {
    if (item.width_cm) return parseInt(item.width_cm, 10);
    if (!item.size) return 0;
    const m = item.size.match(/(?:กว้าง\s*)?(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }

  // Categories Master List
  const CATEGORIES = [
    { id: 'all', name: 'ทั้งหมด' },
    { id: 'ตู้กับข้าว', name: 'ตู้กับข้าว' },
    { id: 'ตู้กับข้าวแผ่นอะลูมิเนียม', name: 'ตู้กับข้าวอะลูมิเนียม' },
    { id: 'ตู้กระเบื้อง & วางเตาแก๊ส', name: 'ตู้กระเบื้อง & เตาแก๊ส' },
    { id: 'ตู้ครัวเคาน์เตอร์ทรงสูง', name: 'ตู้ครัวทรงสูง' },
    { id: 'เคาน์เตอร์ครัวท็อปหิน', name: 'เคาน์เตอร์ท็อปหิน' },
    { id: 'ตู้ใส่ของ 8 บาน', name: 'ตู้ใส่ของ 8 บาน' },
    { id: 'ตู้เสื้อผ้า & ตู้ใส่ของ', name: 'ตู้เสื้อผ้า & ตู้โชว์' },
    { id: 'ตู้กับข้าวมินิมอล D-Series', name: 'ตู้กับข้าว D-Series' },
    { id: 'ตู้เก็บของมินิมอล D-Series', name: 'ตู้เก็บของ D-Series' }
  ];

  // Initialize
  async function initCatalog() {
    try {
      const response = await fetch('assets/data/tulo_items.json');
      if (!response.ok) throw new Error('Failed to load catalog data');
      allProducts = await response.json();
      filteredProducts = [...allProducts];

      updateFilterCounts();
      renderCategoryCarousel();
      renderSidebarCategories();
      renderDrawerCategories();
      applyFilter();
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

  // Update Size & Category Count Labels
  function updateFilterCounts() {
    let smallCount = 0, medCount = 0, largeCount = 0;
    allProducts.forEach(item => {
      const w = getProductWidth(item);
      if (w > 0 && w <= 80) smallCount++;
      else if (w > 80 && w <= 120) medCount++;
      else if (w > 120) largeCount++;
    });

    const elAll = document.getElementById('count-size-all');
    const elSmall = document.getElementById('count-size-small');
    const elMed = document.getElementById('count-size-medium');
    const elLarge = document.getElementById('count-size-large');
    if (elAll) elAll.textContent = `(${allProducts.length})`;
    if (elSmall) elSmall.textContent = `(${smallCount})`;
    if (elMed) elMed.textContent = `(${medCount})`;
    if (elLarge) elLarge.textContent = `(${largeCount})`;
  }

  // Render Category Chips Carousel (Top of PLP)
  function renderCategoryCarousel() {
    if (!categoryCarousel) return;

    const counts = { all: allProducts.length };
    allProducts.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    categoryCarousel.innerHTML = CATEGORIES.map(cat => {
      const count = counts[cat.id] || 0;
      const isActive = cat.id === currentCategory;
      return `
        <button type="button" 
                class="hp-cat-chip ${isActive ? 'active' : ''}" 
                data-category="${cat.id}"
                role="tab"
                aria-selected="${isActive}">
          ${escapeHtml(cat.name)} <span class="chip-count">(${count})</span>
        </button>
      `;
    }).join('');

    categoryCarousel.querySelectorAll('.hp-cat-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        setCategory(btn.getAttribute('data-category'));
      });
    });
  }

  // Render Sidebar Category Filter
  function renderSidebarCategories() {
    if (!sidebarCategories) return;

    const counts = { all: allProducts.length };
    allProducts.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    sidebarCategories.innerHTML = CATEGORIES.map(cat => {
      const count = counts[cat.id] || 0;
      const isActive = cat.id === currentCategory;
      return `
        <label class="hp-filter-option ${isActive ? 'active' : ''}" data-cat="${cat.id}">
          <span class="hp-filter-label">
            <input type="radio" name="sidebar-category" value="${cat.id}" ${isActive ? 'checked' : ''} class="hp-filter-radio">
            ${escapeHtml(cat.name)}
          </span>
          <span class="hp-filter-count">(${count})</span>
        </label>
      `;
    }).join('');

    sidebarCategories.querySelectorAll('input[name="sidebar-category"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setCategory(radio.value);
      });
    });
  }

  // Render Drawer Category Filter (Mobile)
  function renderDrawerCategories() {
    if (!drawerCategories) return;

    const counts = { all: allProducts.length };
    allProducts.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });

    drawerCategories.innerHTML = CATEGORIES.map(cat => {
      const count = counts[cat.id] || 0;
      const isActive = cat.id === currentCategory;
      return `
        <label class="hp-filter-option ${isActive ? 'active' : ''}" data-cat="${cat.id}">
          <span class="hp-filter-label">
            <input type="radio" name="drawer-category" value="${cat.id}" ${isActive ? 'checked' : ''} class="hp-filter-radio">
            ${escapeHtml(cat.name)}
          </span>
          <span class="hp-filter-count">(${count})</span>
        </label>
      `;
    }).join('');

    drawerCategories.querySelectorAll('input[name="drawer-category"]').forEach(radio => {
      radio.addEventListener('change', () => {
        setCategory(radio.value);
      });
    });
  }

  // Set Category
  function setCategory(catId) {
    currentCategory = catId;

    // Sync Carousel
    if (categoryCarousel) {
      categoryCarousel.querySelectorAll('.hp-cat-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === catId);
      });
    }

    // Sync Sidebar Radio
    if (sidebarCategories) {
      sidebarCategories.querySelectorAll('input[name="sidebar-category"]').forEach(radio => {
        radio.checked = radio.value === catId;
        radio.closest('.hp-filter-option').classList.toggle('active', radio.value === catId);
      });
    }

    // Sync Drawer Radio
    if (drawerCategories) {
      drawerCategories.querySelectorAll('input[name="drawer-category"]').forEach(radio => {
        radio.checked = radio.value === catId;
        radio.closest('.hp-filter-option').classList.toggle('active', radio.value === catId);
      });
    }

    applyFilter();
  }

  // Set Size Range
  function setSizeRange(sizeVal) {
    currentSize = sizeVal;

    document.querySelectorAll('input[name="size-filter"]').forEach(r => {
      r.checked = r.value === sizeVal;
      r.closest('.hp-filter-option').classList.toggle('active', r.value === sizeVal);
    });

    document.querySelectorAll('input[name="drawer-size-filter"]').forEach(r => {
      r.checked = r.value === sizeVal;
      r.closest('.hp-filter-option').classList.toggle('active', r.value === sizeVal);
    });

    applyFilter();
  }

  // Apply Filter & Sorting Engine
  function applyFilter() {
    filteredProducts = allProducts.filter(item => {
      // 1. Category
      if (currentCategory !== 'all' && item.category !== currentCategory) {
        return false;
      }

      // 2. Size
      if (currentSize !== 'all') {
        const w = getProductWidth(item);
        if (currentSize === 'small' && !(w > 0 && w <= 80)) return false;
        if (currentSize === 'medium' && !(w > 80 && w <= 120)) return false;
        if (currentSize === 'large' && !(w > 120)) return false;
      }

      // 3. Photo Only
      if (onlyRefPhoto && !item.ref_cropped && !item.ref_image) {
        return false;
      }

      // 4. Search Query
      if (currentSearch) {
        const q = currentSearch.toLowerCase().trim();
        const codeMatch = item.code && item.code.toLowerCase().includes(q);
        const nameMatch = item.name && item.name.toLowerCase().includes(q);
        const catMatch = item.category && item.category.toLowerCase().includes(q);
        const sizeMatch = item.size && item.size.toLowerCase().includes(q);
        const tagMatch = item.tags && item.tags.some(t => t.toLowerCase().includes(q));
        if (!codeMatch && !nameMatch && !catMatch && !sizeMatch && !tagMatch) {
          return false;
        }
      }

      return true;
    });

    // Apply Sorting
    if (currentSort === 'code-asc') {
      filteredProducts.sort((a, b) => (a.code || '').localeCompare(b.code || '', 'th', { numeric: true }));
    } else if (currentSort === 'code-desc') {
      filteredProducts.sort((a, b) => (b.code || '').localeCompare(a.code || '', 'th', { numeric: true }));
    } else if (currentSort === 'width-asc') {
      filteredProducts.sort((a, b) => getProductWidth(a) - getProductWidth(b));
    } else if (currentSort === 'width-desc') {
      filteredProducts.sort((a, b) => getProductWidth(b) - getProductWidth(a));
    }

    renderActiveTags();
    renderProducts();
    updateBadgeCount();
  }

  // Update Mobile Filter Badge
  function updateBadgeCount() {
    let count = 0;
    if (currentCategory !== 'all') count++;
    if (currentSize !== 'all') count++;
    if (onlyRefPhoto) count++;
    if (currentSearch) count++;

    if (mobileFilterBadge) {
      if (count > 0) {
        mobileFilterBadge.textContent = count;
        mobileFilterBadge.style.display = 'inline-block';
      } else {
        mobileFilterBadge.style.display = 'none';
      }
    }

    if (drawerBtnCount) {
      drawerBtnCount.textContent = filteredProducts.length;
    }
  }

  // Render Active Filter Tags
  function renderActiveTags() {
    if (!activeTagsWrap) return;

    const tags = [];

    if (currentCategory !== 'all') {
      const catObj = CATEGORIES.find(c => c.id === currentCategory);
      tags.push({
        label: `หมวด: ${catObj ? catObj.name : currentCategory}`,
        onRemove: () => setCategory('all')
      });
    }

    if (currentSize !== 'all') {
      let sizeLabel = '';
      if (currentSize === 'small') sizeLabel = 'ขนาด 60 - 80 ซม.';
      if (currentSize === 'medium') sizeLabel = 'ขนาด 81 - 120 ซม.';
      if (currentSize === 'large') sizeLabel = 'ขนาด 121 ซม.+';
      tags.push({
        label: sizeLabel,
        onRemove: () => setSizeRange('all')
      });
    }

    if (onlyRefPhoto) {
      tags.push({
        label: 'มีภาพถ่ายจริง',
        onRemove: () => {
          onlyRefPhoto = false;
          if (filterRefPhotoCheckbox) filterRefPhotoCheckbox.checked = false;
          if (drawerFilterRefPhoto) drawerFilterRefPhoto.checked = false;
          applyFilter();
        }
      });
    }

    if (currentSearch) {
      tags.push({
        label: `ค้นหา: "${currentSearch}"`,
        onRemove: () => {
          currentSearch = '';
          if (searchInput) searchInput.value = '';
          if (searchClearBtn) searchClearBtn.style.display = 'none';
          applyFilter();
        }
      });
    }

    if (tags.length === 0) {
      activeTagsWrap.style.display = 'none';
      activeTagsWrap.innerHTML = '';
      return;
    }

    activeTagsWrap.style.display = 'flex';
    activeTagsWrap.innerHTML = tags.map((t, i) => `
      <span class="hp-active-tag">
        ${escapeHtml(t.label)}
        <span class="hp-active-tag-remove" data-tag-idx="${i}" title="ลบตัวกรอง">✕</span>
      </span>
    `).join('') + `
      <button type="button" class="hp-btn-reset" id="clear-all-tags-btn" style="margin-left: 6px;">
        ล้างตัวกรองทั้งหมด
      </button>
    `;

    activeTagsWrap.querySelectorAll('.hp-active-tag-remove').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-tag-idx'), 10);
        if (tags[idx] && tags[idx].onRemove) tags[idx].onRemove();
      });
    });

    const clearAllBtn = document.getElementById('clear-all-tags-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', resetAllFilters);
    }
  }

  // Reset All Filters
  function resetAllFilters() {
    currentCategory = 'all';
    currentSize = 'all';
    currentSearch = '';
    onlyRefPhoto = false;

    if (searchInput) searchInput.value = '';
    if (searchClearBtn) searchClearBtn.style.display = 'none';
    if (filterRefPhotoCheckbox) filterRefPhotoCheckbox.checked = false;
    if (drawerFilterRefPhoto) drawerFilterRefPhoto.checked = false;

    // Reset Carousel
    if (categoryCarousel) {
      categoryCarousel.querySelectorAll('.hp-cat-chip').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-category') === 'all');
      });
    }

    // Reset Radios
    document.querySelectorAll('input[name="sidebar-category"]').forEach(r => {
      r.checked = r.value === 'all';
      r.closest('.hp-filter-option').classList.toggle('active', r.value === 'all');
    });
    document.querySelectorAll('input[name="drawer-category"]').forEach(r => {
      r.checked = r.value === 'all';
      r.closest('.hp-filter-option').classList.toggle('active', r.value === 'all');
    });
    document.querySelectorAll('input[name="size-filter"]').forEach(r => {
      r.checked = r.value === 'all';
      r.closest('.hp-filter-option').classList.toggle('active', r.value === 'all');
    });
    document.querySelectorAll('input[name="drawer-size-filter"]').forEach(r => {
      r.checked = r.value === 'all';
      r.closest('.hp-filter-option').classList.toggle('active', r.value === 'all');
    });

    applyFilter();
  }

  // Render Products as HomePro Cards
  function renderProducts() {
    if (!productGrid) return;

    if (resultsCountEl) {
      resultsCountEl.textContent = filteredProducts.length;
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
      const refImg = item.ref_cropped || item.ref_image;
      const sizeStr = item.size || 'ขนาดมาตรฐานโรงงาน';

      return `
        <article class="hp-card" data-code="${escapeHtml(item.code)}">
          
          <!-- Image Box with Aspect Ratio 1:1 -->
          <div class="hp-card-media">
            
            <!-- Top Badges -->
            <div class="hp-badges-top-left">
              <span class="hp-badge hp-badge-free">ส่งฟรีในพื้นที่</span>
              <span class="hp-badge hp-badge-factory">ของแท้โรงงาน</span>
            </div>

            <div class="hp-badges-top-right">
              <span class="hp-badge-code">หน้า ${item.ref_page || 1}</span>
            </div>

            <img loading="lazy" 
                 width="480" 
                 height="480" 
                 src="${escapeHtml(item.image)}" 
                 alt="${escapeHtml(item.code)} ${escapeHtml(item.name)}" 
                 onerror="this.src='assets/images/logo/logo-red.png'">

            <!-- Quick View Overlay -->
            <div class="hp-card-quickview" onclick="window.ThaiUdonCatalog.openModal(${index}, 'graphic');">
              <button type="button" class="hp-quickview-btn">
                🔍 ดูภาพ & สเปก
              </button>
            </div>
          </div>

          <!-- Card Body -->
          <div class="hp-card-body">
            <span class="hp-card-brand">ไทยอุดรเฟอร์นิเจอร์ • รหัส ${escapeHtml(item.code)}</span>
            <h2 class="hp-card-title" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h2>
            <p class="hp-card-size">📐 ${escapeHtml(sizeStr)}</p>
            <span class="hp-card-category-pill">${escapeHtml(item.category)}</span>

            <!-- Pricing & Delivery -->
            <div class="hp-card-pricing">
              <div class="hp-price-row">
                <span class="hp-price-label">ราคาพิเศษ</span>
                <span class="hp-price-val">ราคาโรงงาน</span>
              </div>
              <div class="hp-delivery-note">
                <span>✓ ฟรีประกอบ & ติดตั้ง</span>
              </div>

              <!-- Action Buttons -->
              <div class="hp-card-actions">
                <a href="${lineUrl}" target="_blank" rel="noopener noreferrer" class="hp-btn-line-order" title="สั่งซื้อผ่าน Line">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.03 2 11c0 2.87 1.5 5.43 3.84 7.06-.17.6-.61 2.22-.7 2.56-.11.43.16.42.34.3 1.45-.96 3.4-2.28 3.8-2.55.87.24 1.78.37 2.72.37 5.52 0 10-4.03 10-9s-4.48-9-10-9z"/></svg>
                  <span>สั่งซื้อทาง LINE</span>
                </a>

                <div class="hp-card-sub-actions">
                  <button type="button" class="hp-btn-sub" onclick="window.ThaiUdonCatalog.openModal(${index}, 'ref');" title="ดูภาพถ่ายจริง">
                    📸 ภาพจริง
                  </button>
                  <button type="button" class="hp-btn-sub" onclick="window.ThaiUdonCatalog.downloadFile('${escapeHtml(item.image)}', '${escapeHtml(item.filename)}');" title="ดาวน์โหลดไฟล์ PNG">
                    📥 โหลด PNG
                  </button>
                </div>
              </div>

            </div>

          </div>

        </article>
      `;
    }).join('');
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Search input
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.trim();
        if (searchClearBtn) {
          searchClearBtn.style.display = currentSearch ? 'block' : 'none';
        }
        applyFilter();
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        currentSearch = '';
        if (searchInput) searchInput.value = '';
        searchClearBtn.style.display = 'none';
        applyFilter();
      });
    }

    // Sort selects
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (mobileSortSelect) mobileSortSelect.value = currentSort;
        applyFilter();
      });
    }

    if (mobileSortSelect) {
      mobileSortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        if (sortSelect) sortSelect.value = currentSort;
        applyFilter();
      });
    }

    // Size filter radio buttons (Desktop)
    document.querySelectorAll('input[name="size-filter"]').forEach(r => {
      r.addEventListener('change', () => {
        setSizeRange(r.value);
      });
    });

    // Size filter radio buttons (Drawer)
    document.querySelectorAll('input[name="drawer-size-filter"]').forEach(r => {
      r.addEventListener('change', () => {
        setSizeRange(r.value);
      });
    });

    // Ref photo checkboxes
    if (filterRefPhotoCheckbox) {
      filterRefPhotoCheckbox.addEventListener('change', (e) => {
        onlyRefPhoto = e.target.checked;
        if (drawerFilterRefPhoto) drawerFilterRefPhoto.checked = onlyRefPhoto;
        applyFilter();
      });
    }

    if (drawerFilterRefPhoto) {
      drawerFilterRefPhoto.addEventListener('change', (e) => {
        onlyRefPhoto = e.target.checked;
        if (filterRefPhotoCheckbox) filterRefPhotoCheckbox.checked = onlyRefPhoto;
        applyFilter();
      });
    }

    // Reset buttons
    if (sidebarResetBtn) sidebarResetBtn.addEventListener('click', resetAllFilters);
    if (emptyResetBtn) emptyResetBtn.addEventListener('click', resetAllFilters);
    if (drawerResetBtn) drawerResetBtn.addEventListener('click', resetAllFilters);

    // Mobile Drawer Open / Close
    if (mobileFilterOpenBtn) {
      mobileFilterOpenBtn.addEventListener('click', openFilterDrawer);
    }
    if (drawerCloseBtn) {
      drawerCloseBtn.addEventListener('click', closeFilterDrawer);
    }
    if (drawerBackdrop) {
      drawerBackdrop.addEventListener('click', closeFilterDrawer);
    }
    if (drawerApplyBtn) {
      drawerApplyBtn.addEventListener('click', () => {
        closeFilterDrawer();
        const gridEl = document.getElementById('product-grid');
        if (gridEl) gridEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }

    // Modal Events
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (previewModal) {
      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (previewModal && previewModal.classList.contains('active')) {
          closeModal();
        }
        if (filterDrawer && filterDrawer.classList.contains('show')) {
          closeFilterDrawer();
        }
      }
      if (previewModal && previewModal.classList.contains('active')) {
        if (e.key === 'ArrowLeft') showPrevProduct();
        if (e.key === 'ArrowRight') showNextProduct();
      }
    });

    if (modalPrevBtn) modalPrevBtn.addEventListener('click', showPrevProduct);
    if (modalNextBtn) modalNextBtn.addEventListener('click', showNextProduct);

    if (tabGraphic) {
      tabGraphic.addEventListener('click', () => setModalTab('graphic'));
    }
    if (tabRef) {
      tabRef.addEventListener('click', () => setModalTab('ref'));
    }
  }

  // Drawer Open / Close
  function openFilterDrawer() {
    if (filterDrawer && drawerBackdrop) {
      drawerBackdrop.classList.add('show');
      filterDrawer.classList.add('show');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeFilterDrawer() {
    if (filterDrawer && drawerBackdrop) {
      filterDrawer.classList.remove('show');
      drawerBackdrop.classList.remove('show');
      document.body.style.overflow = '';
    }
  }

  // Check URL Params
  function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const search = params.get('search');
    if (cat) setCategory(cat);
    if (search) {
      currentSearch = search;
      if (searchInput) {
        searchInput.value = search;
        if (searchClearBtn) searchClearBtn.style.display = 'block';
      }
      applyFilter();
    }
  }

  // Modal Functions
  function openModal(index, initialTab = 'graphic') {
    if (!previewModal || !filteredProducts[index]) return;
    activeModalIndex = index;
    const item = filteredProducts[index];

    if (modalCode) modalCode.textContent = item.code || 'TD-00';
    if (modalTitle) modalTitle.textContent = item.name || '';
    if (modalCategory) modalCategory.textContent = item.category || 'ตู้โล';
    if (modalSize) modalSize.textContent = item.size || 'ขนาดมาตรฐานโรงงาน';
    if (modalPageNum) modalPageNum.textContent = `หน้า ${item.ref_page || 1}`;

    if (modalProductImg) {
      modalProductImg.src = item.image || '';
      modalProductImg.alt = `${item.code} ${item.name}`;
    }

    const refSrc = item.ref_cropped || item.ref_image;
    if (modalRefImg) {
      modalRefImg.src = refSrc || item.image || '';
      modalRefImg.alt = `ภาพอ้างอิง ${item.code}`;
    }

    if (modalExternalLink) {
      modalExternalLink.href = item.image || '#';
    }

    // Modal Line Order
    if (modalLineBtn) {
      const lineMsg = encodeURIComponent(`สวัสดีครับ สนใจสั่งซื้อสินค้า [รหัส ${item.code}] ${item.name} (${item.size || ''}) จากเว็บไซต์ไทยอุดรเฟอร์นิเจอร์ ขอทราบรายละเอียดครับ`);
      modalLineBtn.href = `https://line.me/ti/p/~0930494178?text=${lineMsg}`;
    }

    // Downloads
    if (modalDownloadGraphicBtn) {
      modalDownloadGraphicBtn.onclick = () => downloadFile(item.image, item.filename || `${item.code}.png`);
    }
    if (modalDownloadRefBtn) {
      modalDownloadRefBtn.onclick = () => downloadFile(refSrc, `${item.code}_ref.png`);
    }

    setModalTab(initialTab);
    previewModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!previewModal) return;
    previewModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  function setModalTab(tab) {
    if (tab === 'graphic') {
      if (tabGraphic) tabGraphic.classList.add('active');
      if (tabRef) tabRef.classList.remove('active');
      if (modalGraphicView) modalGraphicView.style.display = 'flex';
      if (modalRefView) modalRefView.style.display = 'none';
      if (modalExternalLink && filteredProducts[activeModalIndex]) {
        modalExternalLink.href = filteredProducts[activeModalIndex].image;
      }
    } else {
      if (tabGraphic) tabGraphic.classList.remove('active');
      if (tabRef) tabRef.classList.add('active');
      if (modalGraphicView) modalGraphicView.style.display = 'none';
      if (modalRefView) modalRefView.style.display = 'flex';
      if (modalExternalLink && filteredProducts[activeModalIndex]) {
        const item = filteredProducts[activeModalIndex];
        modalExternalLink.href = item.ref_cropped || item.ref_image;
      }
    }
  }

  function showPrevProduct() {
    if (filteredProducts.length === 0) return;
    let newIndex = activeModalIndex - 1;
    if (newIndex < 0) newIndex = filteredProducts.length - 1;
    openModal(newIndex, tabRef && tabRef.classList.contains('active') ? 'ref' : 'graphic');
  }

  function showNextProduct() {
    if (filteredProducts.length === 0) return;
    let newIndex = activeModalIndex + 1;
    if (newIndex >= filteredProducts.length) newIndex = 0;
    openModal(newIndex, tabRef && tabRef.classList.contains('active') ? 'ref' : 'graphic');
  }

  // Download Helper
  function downloadFile(url, filename) {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'thaiudon-product.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // HTML Escape Helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Expose to window
  window.ThaiUdonCatalog = {
    openModal,
    downloadFile,
    setCategory,
    setSizeRange,
    resetAllFilters
  };

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', initCatalog);
})();
