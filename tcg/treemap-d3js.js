class Treemap {
  // Configuration constants
  static CONFIG = {
    MINIMAL_MARKET_PRICE: 5.0,
    HEADER_HEIGHT: 24,
    PATHBAR_HEIGHT: 40,
  };

  static PRODUCT_LINES = [
    { label: "Pokemon", value: "pokemon" },
    { label: "Pokemon JP", value: "pokemon-japan" },
    { label: "Yu-Gi-Oh!", value: "yugioh" },
    { label: "One Piece", value: "one-piece-card-game" },
  ];

  constructor(containerId, productLineName, rawData) {
    this.productLineName = productLineName;
    this.rawData = rawData;
    this.container = document.getElementById(containerId);
    this.tooltip = document.getElementById("tooltip");
    this.columnIndex = {};
    
    // Initialize core properties
    this.initializeProperties();
    
    // Set up UI components
    this.setupPathbar();
    this.setupCanvas();
    this.bindEvents();
    
    // Initialize dimensions and observers
    this.updateDimensions();
    this.initializeResizeObserver();
  }

  initializeProperties() {
    this.nodes = [];
    this.currentRoot = null;
    this.nodesMap = new Map();
    this.cache = {
      hierarchy: null,
      lastWidth: 0,
      lastHeight: 0
    };
    this.rootNode = null;
  }

  initializeResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      if (!entries.length) return;
      
      requestAnimationFrame(() => {
        const entry = entries[0];
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height - Treemap.CONFIG.PATHBAR_HEIGHT;

        if (newWidth === this.cache.lastWidth && newHeight === this.cache.lastHeight) return;
        
        this.cache.lastWidth = newWidth;
        this.cache.lastHeight = newHeight;
        this.updateDimensions(newWidth, newHeight);

        if (this.currentRoot) {
          this.updateLayout();
        }
      });
    });
    
    this.resizeObserver.observe(this.container);
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + "px";
    this.canvas.style.height = height + "px";

    this.ctx = this.canvas.getContext("2d");
    this.ctx.scale(dpr, dpr);
  }

  async updateLayout() {
    if (!this.cache.hierarchy) {
      this.cache.hierarchy = d3
        .hierarchy(this.currentRoot.data)
        .sum((d) => (d.type === "sector" ? 0 : d.value))
        .sort((a, b) => b.value - a.value);
    }

    const treemap = d3
      .treemap()
      .size([this.width, this.height])
      .paddingTop((d) => {
        if (d === this.cache.hierarchy || !d.children) return 0;
        return 24;
      })
      .paddingRight(1)
      .paddingBottom(1)
      .paddingLeft(1)
      .round(true);

    treemap(this.cache.hierarchy);
    this.nodes = this.cache.hierarchy.descendants();

    this.render();
    this.updatePathbar();
  }

  destroy() {
    this.resizeObserver.disconnect();
  }

  setupCanvas() {
    this.width = this.container.clientWidth;
    this.height = this.container.clientHeight - Treemap.CONFIG.PATHBAR_HEIGHT;

    this.canvas = document.createElement("canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.top = `${Treemap.CONFIG.PATHBAR_HEIGHT}px`;
    this.canvas.style.left = "0";

    // Set up high DPI canvas
    this.updateCanvasResolution();
    this.container.appendChild(this.canvas);
  }

  updateCanvasResolution() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    
    this.ctx = this.canvas.getContext("2d");
    this.ctx.scale(dpr, dpr);
  }

  setupPathbar() {
    this.pathbarContainer = document.createElement("div");
    this.pathbarContainer.className = "pathbar-container";
    this.pathbarContainer.style.position = "absolute";
    this.pathbarContainer.style.top = "0";
    this.pathbarContainer.style.left = "0";
    this.pathbarContainer.style.width = "calc(100% - 48px)";
    this.pathbarContainer.style.height = `${Treemap.CONFIG.PATHBAR_HEIGHT}px`;
    this.pathbarContainer.style.backgroundColor = "#1e222d";
    this.pathbarContainer.style.display = "flex";
    this.pathbarContainer.style.alignItems = "center";
    this.pathbarContainer.style.borderBottom = "1px solid #2a2e39";
    this.pathbarContainer.style.overflow = "hidden";
    this.pathbarContainer.style.boxSizing = "border-box";
    this.container.appendChild(this.pathbarContainer);
  }

  getPathToRoot(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift(current);
      current = current.parent || null;
    }
    return path;
  }

  showPathbarDropdown(triggerElement, options, onSelect) {
    const existing = document.getElementById("pathbarDropdownMenu");
    if (existing) existing.remove();

    const rect = triggerElement.getBoundingClientRect();
    const menu = document.createElement("div");
    menu.id = "pathbarDropdownMenu";
    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 4}px`;
    menu.style.left = `${Math.max(10, rect.left)}px`;
    menu.style.backgroundColor = "#242834";
    menu.style.border = "1px solid #3d4356";
    menu.style.borderRadius = "6px";
    menu.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.5)";
    menu.style.zIndex = "10001";
    menu.style.maxHeight = "300px";
    menu.style.overflowY = "auto";
    menu.style.minWidth = "160px";
    menu.style.padding = "4px 0";

    options.forEach((opt) => {
      const item = document.createElement("div");
      item.style.padding = "8px 14px";
      item.style.color = "#ffffff";
      item.style.fontSize = "13px";
      item.style.fontFamily = "Arial, sans-serif";
      item.style.cursor = "pointer";
      item.style.transition = "background-color 0.15s ease";
      item.style.display = "flex";
      item.style.alignItems = "center";
      item.style.justifyContent = "space-between";
      item.style.userSelect = "none";
      item.textContent = opt.label;

      item.addEventListener("mouseenter", () => {
        item.style.backgroundColor = "#3a4155";
      });
      item.addEventListener("mouseleave", () => {
        item.style.backgroundColor = "transparent";
      });
      item.addEventListener("click", (event) => {
        event.stopPropagation();
        menu.remove();
        onSelect(opt);
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const closeHandler = (event) => {
      if (!menu.contains(event.target) && event.target !== triggerElement) {
        menu.remove();
        document.removeEventListener("click", closeHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener("click", closeHandler);
    }, 0);
  }

  updatePathbar() {
    if (!this.pathbarContainer) return;

    this.pathbarContainer.innerHTML = "";

    const path = this.getPathToRoot(this.currentRoot || this.rootNode);
    if (!path.length) return;

    const sectionsContainer = document.createElement("div");
    sectionsContainer.style.display = "flex";
    sectionsContainer.style.width = "100%";
    sectionsContainer.style.height = "100%";
    this.pathbarContainer.appendChild(sectionsContainer);

    const totalCount = path.length;
    const arrowWidth = 12;

    path.forEach((node, index) => {
      const isFirst = index === 0;
      const isLast = index === totalCount - 1;

      let clipPath = "none";
      let padding = "0 10px";

      if (totalCount > 1) {
        if (isFirst) {
          clipPath = `polygon(0 0, calc(100% - ${arrowWidth}px) 0, 100% 50%, calc(100% - ${arrowWidth}px) 100%, 0 100%)`;
          padding = `0 ${arrowWidth + 6}px 0 10px`;
        } else if (isLast) {
          clipPath = `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${arrowWidth}px 50%)`;
          padding = `0 10px 0 ${arrowWidth + 6}px`;
        } else {
          clipPath = `polygon(0 0, calc(100% - ${arrowWidth}px) 0, 100% 50%, calc(100% - ${arrowWidth}px) 100%, 0 100%, ${arrowWidth}px 50%)`;
          padding = `0 ${arrowWidth + 6}px 0 ${arrowWidth + 6}px`;
        }
      }

      const section = document.createElement("div");
      section.style.flex = "1 1 0%";
      section.style.height = "100%";
      section.style.backgroundColor = isFirst ? "#414554" : "#2C3E50";
      section.style.display = "flex";
      section.style.alignItems = "center";
      section.style.justifyContent = "center";
      section.style.cursor = "pointer";
      section.style.transition = "background-color 0.2s ease";
      section.style.position = "relative";
      section.style.clipPath = clipPath;
      section.style.marginLeft = "0px";
      section.style.zIndex = (totalCount - index).toString();
      section.style.padding = padding;

      const labelContainer = document.createElement("div");
      labelContainer.style.display = "flex";
      labelContainer.style.alignItems = "center";
      labelContainer.style.justifyContent = "center";
      labelContainer.style.maxWidth = "100%";
      labelContainer.style.overflow = "hidden";

      const labelSpan = document.createElement("span");
      labelSpan.style.color = "#ffffff";
      labelSpan.style.fontFamily = "Arial, sans-serif";
      labelSpan.style.fontSize = "13px";
      labelSpan.style.fontWeight = "bold";
      labelSpan.style.textAlign = "center";
      labelSpan.style.overflow = "hidden";
      labelSpan.style.textOverflow = "ellipsis";
      labelSpan.style.whiteSpace = "nowrap";
      labelSpan.style.pointerEvents = "none";
      labelSpan.style.minWidth = "0";
      labelSpan.style.flex = "0 1 auto";

      if (isFirst) {
        const shortName = Treemap.PRODUCT_LINES.find(
          (p) => p.value === this.productLineName
        )?.label;
        labelSpan.textContent = shortName || node.data?.name || "All sets";
      } else {
        labelSpan.textContent = node.data?.name || "All sets";
      }

      labelContainer.appendChild(labelSpan);

      const chevronBtn = document.createElement("span");
      chevronBtn.style.flexShrink = "0";
      chevronBtn.style.marginLeft = "4px";
      chevronBtn.style.fontSize = "10px";
      chevronBtn.style.opacity = "0.85";
      chevronBtn.style.pointerEvents = "none";
      chevronBtn.style.display = "inline-flex";
      chevronBtn.style.alignItems = "center";
      chevronBtn.style.userSelect = "none";
      chevronBtn.textContent = "▼";

      labelContainer.appendChild(chevronBtn);
      section.appendChild(labelContainer);

      section.addEventListener("click", (event) => {
        event.stopPropagation();
        if (isFirst) {
          this.showPathbarDropdown(labelContainer, Treemap.PRODUCT_LINES, (opt) => {
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("productLine", opt.value);
            window.location.href = newUrl.toString();
          });
        } else {
          const parentNode = node.parent || this.rootNode;
          if (parentNode?.children) {
            const setOptions = parentNode.children
              .map((child) => ({
                label: child.data?.name || "Unknown Set",
                value: child.data?.name,
                node: child,
              }))
              .sort((a, b) => a.label.localeCompare(b.label));

            this.showPathbarDropdown(labelContainer, setOptions, (opt) => {
              if (opt.node) {
                this.drillDown(opt.node);
              }
            });
          }
        }
      });

      section.addEventListener("mouseenter", () => {
        section.style.backgroundColor = "#555b6e";
      });
      section.addEventListener("mouseleave", () => {
        section.style.backgroundColor = isFirst ? "#414554" : "#2C3E50";
      });

      section.addEventListener("mousemove", (event) => {
        this.showTooltip(node, event);
      });
      section.addEventListener("mouseleave", () => {
        this.hideTooltip();
      });

      sectionsContainer.appendChild(section);
    });
  }

  bindEvents() {
    // Click handling for drill-down
    this.canvas.addEventListener("click", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const node = this.findNodeAtPoint(x, y);

      if (node) {
        this.drillDown(node);
      }
      this.hideTooltip();
    });

    // Mouse move for tooltips
    this.canvas.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const node = this.findNodeAtPoint(x, y);

      if (node) {
        this.canvas.style.cursor = "pointer";
        this.showTooltip(node, event);
      } else {
        this.canvas.style.cursor = "default";
        this.hideTooltip();
      }
    });
  }

  // Update findNodeAtPoint to handle header areas
  findNodeAtPoint(x, y) {
    return this.nodes.find((node) => {
      if (!node.parent) return false; // Skip root node

      if (node.children) {
        // For parent nodes, only check header area
        return (
          x >= node.x0 &&
          x <= node.x1 &&
          y >= node.y0 &&
          y <= node.y0 + Treemap.CONFIG.HEADER_HEIGHT
        );
      } else {
        // For leaf nodes, check entire area
        return x >= node.x0 && x <= node.x1 && y >= node.y0 && y <= node.y1;
      }
    });
  }

  getCardInfo(node, details = "verbose") {
    const productId = node.data.ticker;
    const productRawData = this.rawData.find(
      (item) => item.productId === productId
    );

    const customAttributes = {
      name: node.data.name,
      marketPrice: node.value,
    };

    if (node.children && node.children.length) {
      customAttributes.nodeChildrenLength = node.children.length;
    }

    if (productRawData && productRawData.customAttributes) {
      Object.assign(customAttributes, productRawData.customAttributes);
    }

    const cardInfo = formatCardInfo(customAttributes, details);
    return cardInfo;
  }

  async renderFromNode(node) {
    if (!node?.data) return;

    // Store root node when it's first rendered
    if (!this.rootNode && (!node.parent || node === this.cache.hierarchy)) {
      this.rootNode = node;
    }

    if (!node.data.children?.length) {
      const cardInfo = this.getCardInfo(node, "verbose");
      const productId = node.data.ticker;
      // Clear any existing overlay first
      const existingOverlay = document.getElementById("overlay");
      if (existingOverlay) {
        existingOverlay.remove();
      }
      updateOverlayWidget(cardInfo, this.productLineName, productId);
      return;
    }

    this.currentRoot = node;

    // Clear cache when switching nodes
    this.cache.hierarchy = null;

    // Create new hierarchy for new node
    this.cache.hierarchy = d3
      .hierarchy(node.data)
      .sum((d) => (d.type === "sector" ? 0 : d.value))
      .sort((a, b) => b.value - a.value);

    const treemap = d3
      .treemap()
      .size([this.width, this.height])
      .paddingTop((d) => {
        // No padding for root node and leaf nodes
        if (d === this.cache.hierarchy || !d.children) return 0;
        // Add padding only for parent nodes
        return 24;
      })
      .paddingRight(1)
      .paddingBottom(1)
      .paddingLeft(1)
      .round(true);

    treemap(this.cache.hierarchy);
    this.nodes = this.cache.hierarchy.descendants();
    this.render();
    this.updatePathbar();
  }

  async render() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw nodes in correct order (back to front)
    this.nodes.forEach((node) => {
      if (!node.parent) return; // Skip root node

      const width = node.x1 - node.x0;
      const height = node.y1 - node.y0;

      if (node.children) {
        // Parent node

        // Draw main area
        this.ctx.fillStyle = "#2C3E50";
        this.ctx.fillRect(node.x0, node.y0, width, height);

        // Draw header
        this.ctx.fillStyle = "#34495E";
        this.ctx.fillRect(node.x0, node.y0, width, 24);

        // Draw header text
        this.ctx.fillStyle = "#fff";
        this.ctx.font = "bold 12px Arial";
        this.ctx.textBaseline = "middle";
        const text = `${node.data.name}`;
        const truncatedText = this.getTruncatedText(text, width - 25);
        this.ctx.fillText(truncatedText, node.x0 + 4, node.y0 + 12);
      } else {
        // Leaf node
        this.renderLeafNode(node, width, height);
      }

      // Draw borders
      this.ctx.strokeStyle = "#fff";
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(node.x0, node.y0, width, height);
    });
  }

  async renderLeafNode(node, width, height) {
    // Draw background color first (fallback)
    this.ctx.fillStyle = "#41475d";
    this.ctx.fillRect(node.x0, node.y0, width, height);

    // Only proceed if there's enough space
    if (width > 30 || height > 45) {
      this.renderNodeText(node, width, height);

      try {
        // Create a Promise for image loading
        const loadImage = (src) => {
          return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
          });
        };

        let productId = node.data.ticker;
        let roundedProductId = Math.floor(productId / 1000) * 1000;
        let imageSrc = `https://raw.githubusercontent.com/finmap-org/data-tcg/refs/heads/main/images/previews/${this.productLineName}/default.webp`;
        const defaultImageSrc = imageSrc;

        // Determine image source based on size
        if (width > 60 || height > 90) {
          // (width > 100 || height > 150) {
          imageSrc = `https://raw.githubusercontent.com/finmap-org/data-tcg/refs/heads/main/images/previews/${this.productLineName}/${roundedProductId}/${productId}.webp`;
        }

        // Load image asynchronously
        const image = await loadImage(imageSrc).catch(() => {
          // Fallback to default image if specific image fails to load
          return loadImage(`${defaultImageSrc}`);
        });

        // Calculate scaling to maintain aspect ratio while filling width
        const imageAspect = image.width / image.height;
        const nodeAspect = width / height;

        let sx = 0,
          sy = 0,
          sWidth = image.width,
          sHeight = image.height;

        if (imageAspect > nodeAspect) {
          // Image is wider than node - crop sides
          sWidth = Math.floor(image.height * nodeAspect);
          sx = Math.floor((image.width - sWidth) / 2);
        } else {
          // Image is taller than node - crop top/bottom
          sHeight = Math.floor(image.width / nodeAspect);
          sy = 0; // Math.floor((image.height - sHeight) / 2);
        }

        // Draw the image
        this.ctx.drawImage(
          image,
          sx,
          sy,
          sWidth,
          sHeight, // Source rectangle
          node.x0,
          node.y0,
          width,
          height // Destination rectangle
        );

        // Render text again on top of the image
        this.renderNodeText(node, width, height);
      } catch (error) {
        console.error(`Failed to load image for node:`, error);
      }
    }
  }

  renderNodeText(node, width, height) {
    // Calculate font size based on node dimensions
    const fontSize = Math.min(
      Math.max(width / 10, 8),
      Math.min(height / 2, 48)
    );

    // Add semi-transparent background for better text readability
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    this.ctx.fillRect(node.x0, node.y0, width, height);

    // Draw text
    this.ctx.fillStyle = "#fff";
    this.ctx.font = `bold ${fontSize}px Arial`;
    this.ctx.textBaseline = "middle";

    const text = `${node.data.name}<br>$${d3.format(",.2f")(node.value)}`;
    // Split the text into lines and draw each line separately
    const lines = text.split("<br>");
    const lineHeight = fontSize * 1.0;
    for (let i = 0; i < lines.length; i++) {
      const truncatedText = this.getTruncatedText(lines[i], width - 6);
      this.ctx.fillText(
        truncatedText,
        node.x0 + 3,
        node.y0 + i * lineHeight + height / 2
      );
    }
  }

  getTruncatedText(text, maxWidth) {
    let truncated = text;
    this.ctx.save();

    while (
      this.ctx.measureText(truncated).width > maxWidth &&
      truncated.length > 3
    ) {
      truncated = truncated.slice(0, -1);
    }

    this.ctx.restore();
    return truncated !== text ? truncated + "..." : truncated;
  }

  async drillDown(node) {
    // if (!node || this.currentRoot === node) return;
    if (!node) return;

    // Update current root and render
    this.currentRoot = node;
    this.renderFromNode(node);
  }

  transformData(securitiesData) {
    if (
      !securitiesData?.securities?.columns ||
      !securitiesData?.securities?.data
    ) {
      throw new Error("Invalid securities data format");
    }

    const { columns, data } = securitiesData.securities;

    // Display products where market price >= MINIMAL_MARKET_PRICE, USD
    const filteredData = data.filter(row => row[17] >= Treemap.CONFIG.MINIMAL_MARKET_PRICE);

    // Set up column indices
    this.setupColumnIndices(columns);

    // Find and validate root node
    const rootRow = this.findRootNode(filteredData);

    // Build node hierarchy
    const { root } = this.buildNodeHierarchy(rootRow, filteredData);

    return root;
  }

  setupColumnIndices(columns) {
    columns.forEach((col, idx) => (this.columnIndex[col] = idx));
  }

  createNode(row) {
    return {
      name: row[this.columnIndex.nameEng],
      value:
        row[this.columnIndex.type] !== "sector"
          ? parseFloat(row[this.columnIndex.marketCap]) || 0
          : 0,
      type: row[this.columnIndex.type],
      sector: row[this.columnIndex.sector],
      ticker: row[this.columnIndex.ticker],
      industry: row[this.columnIndex.industry],
      exchange: row[this.columnIndex.exchange],
      nestedItemsCount: parseInt(row[this.columnIndex.nestedItemsCount]) || 0,
      rawData: row,
    };
  }

  findRootNode(data) {
    const rootRow = data.find((row) => row[this.columnIndex.sector] === "");
    if (!rootRow) {
      throw new Error("Root node not found in data");
    }
    return rootRow;
  }

  buildNodeHierarchy(rootRow, data) {
    this.nodesMap.clear();

    // Create root node
    const root = {
      ...this.createNode(rootRow),
      children: [],
      parent: null, // Add parent reference
    };
    this.nodesMap.set(rootRow[this.columnIndex.ticker], root);

    // Create all nodes first
    data.forEach((row) => {
      const ticker = row[this.columnIndex.ticker];
      if (ticker !== rootRow[this.columnIndex.ticker]) {
        this.nodesMap.set(ticker, {
          ...this.createNode(row),
          children: [],
          parent: null, // Will set correct parent in next step
        });
      }
    });

    // Build hierarchy with parent references
    data.forEach((row) => {
      const ticker = row[this.columnIndex.ticker];
      const parentSector = row[this.columnIndex.sector];

      if (ticker === rootRow[this.columnIndex.ticker]) return;

      const node = this.nodesMap.get(ticker);
      const parentNode = this.nodesMap.get(parentSector);

      if (parentNode) {
        parentNode.children.push(node);
        node.parent = parentNode; // Set parent reference
      } else if (parentSector !== "") {
        root.children.push(node);
        node.parent = root; // Set parent reference
      }
    });

    return { root, nodesMap: this.nodesMap };
  }

  showTooltip(node, event) {
    if (!node?.data || !event) {
      return;
    }

    const tooltip = d3.select(this.tooltip);

    const tooltipContent = this.getCardInfo(node, "short");

    tooltip
      .style("display", "block")
      .style("left", `${event.pageX + 10}px`)
      .style("top", `${event.pageY + 10}px`)
      .html(tooltipContent);
  }

  hideTooltip() {
    d3.select(this.tooltip).style("display", "none");
  }
}

class OverlayManager {
  constructor() {
    // First, remove any existing overlay
    const existingOverlay = document.getElementById("overlay");
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    this.overlayDiv = null;
    this.cardInfoDiv = null;
    this.infoButton = null;
    this.buyLink = null;
    this.closeButton = null;
    this.isInfoVisible = true;
  }

  initializeOverlay(cardInfo, productLineName, productId) {
    if (!this.overlayDiv) {
      this.createOverlayElements(cardInfo, productId);
      this.attachEventListeners();
      document.body.appendChild(this.overlayDiv);
    }

    this.updateOverlayContent(cardInfo, productLineName, productId);
  }

  createOverlayElements(cardInfo, productId) {
    this.overlayDiv = document.createElement("div");
    this.overlayDiv.id = "overlay";
    this.overlayDiv.className = "overlay";

    this.cardInfoDiv = document.createElement("div");
    this.cardInfoDiv.id = "cardInfoDiv";
    this.cardInfoDiv.className = "cardInfoDiv";
    this.cardInfoDiv.innerHTML = cardInfo;

    this.infoButton = document.createElement("button");
    this.infoButton.id = "infoButton";
    this.infoButton.className = "button active";
    this.infoButton.textContent = "i";

    this.closeButton = document.createElement("button");
    this.closeButton.id = "closeButton";
    this.closeButton.className = "button active";
    this.closeButton.textContent = "×";

    this.buyLink = document.createElement("a");
    this.buyLink.id = "buyButton";
    this.buyLink.className = "button active";
    this.buyLink.href = ``;
    this.buyLink.target = "_blank";
    this.buyLink.textContent = "buy";

    this.overlayDiv.appendChild(this.cardInfoDiv);
    // this.overlayDiv.appendChild(this.buyLink);
    this.overlayDiv.appendChild(this.infoButton);
    this.overlayDiv.appendChild(this.closeButton);
  }

  attachEventListeners() {
    // Store bound methods to properly remove later
    this.handleClose = () => this.destroyOverlay();
    this.handleToggleInfo = () => this.toggleInfoVisibility();
    
    this.closeButton.addEventListener("click", this.handleClose);
    this.infoButton.addEventListener("click", this.handleToggleInfo);
  }

  updateOverlayContent(cardInfo, productLineName, productId) {
    this.cardInfoDiv.innerHTML = cardInfo;
    // this.buyLink.href = ``;

    const roundedProductId = Math.floor(productId / 1000) * 1000;
    const imageSrc = `https://raw.githubusercontent.com/finmap-org/data-tcg/refs/heads/main/images/${productLineName}/${roundedProductId}/${productId}.jpg`;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      this.overlayDiv.style.backgroundImage = `url(${imageSrc})`;
    };
    img.onerror = () => {
      console.error(`Failed to load image: ${imageSrc}`);
      this.overlayDiv.style.backgroundImage = "none";
      this.overlayDiv.style.backgroundColor = "#41475d";
    };

    this.showOverlay();
  }

  showOverlay() {
    this.overlayDiv.style.visibility = "visible";
    this.cardInfoDiv.style.visibility = "visible";
  }

  toggleInfoVisibility() {
    this.isInfoVisible = !this.isInfoVisible;
    if (this.isInfoVisible) {
      this.cardInfoDiv.style.visibility = "visible";
      this.infoButton.classList.add("active");
      this.closeButton.classList.add("active");
      // this.buyLink.classList.add("active");
    } else {
      this.cardInfoDiv.style.visibility = "hidden";
      this.infoButton.classList.remove("active");
      this.closeButton.classList.remove("active");
      // this.buyLink.classList.remove("active");
    }
  }

  destroyOverlay() {
    if (this.overlayDiv) {
      // Remove listeners
      this.closeButton.removeEventListener("click", this.handleClose);
      this.infoButton.removeEventListener("click", this.handleToggleInfo);
      
      document.body.removeChild(this.overlayDiv);
      this.overlayDiv = null;
      this.cardInfoDiv = null;
      this.infoButton = null;
      // this.buyLink = null;
      this.closeButton = null;
    }
  }
}

async function updateOverlayWidget(cardInfo, productLineName, productId) {
  const overlayManager = new OverlayManager();
  overlayManager.initializeOverlay(cardInfo, productLineName, productId);
}

function formatCardInfo(cardInfo, details = "verbose") {
  const releaseDate = cardInfo.releaseDate
    ? cardInfo.releaseDate.split("T")[0]
    : "N/A";
  const formattedMarketPrice = cardInfo.marketPrice
    ? `$${cardInfo.marketPrice.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "N/A";

  let html = `
        <p><b>${cardInfo.name || "Unknown"}</b></p>
        <p><b>MARKET PRICE</b> ${formattedMarketPrice || "N/A"}</p>
        <p><b>RELEASE DATE</b> ${releaseDate}</p>
    `;

  switch (details) {
    case "short":
      if (cardInfo.nodeChildrenLength) {
        html = `${html}
          <div style="margin-top: 5px; color: #8BE9FD;">
              Click to view ${cardInfo.nodeChildrenLength} items
          </div>`;
      } else {
        html = `${html}
          <div style="margin-top: 5px; color: #8BE9FD;">
              Click to view details
          </div>`;
      }
      break;
    case "verbose":
    default:
      html = `${html}
        <p>${cardInfo.number} | ${cardInfo.rarityDbName || ""}</p>
        <p>${cardInfo.description || ""}</p>
        <p>${cardInfo.flavorText || ""}</p>
        <p>
          <b>HP</b> ${cardInfo.hp || "N/A"}<br>
          <b>ENERGY TYPE</b> ${cardInfo.energyType || "N/A"}<br>
          <b>STAGE</b> ${cardInfo.stage || "N/A"}
        </p>
        <p>
          <b>RESISTANCE</b> ${cardInfo.resistance || "N/A"}<br>
          <b>WEAKNESS</b> ${cardInfo.weakness || "N/A"}
        </p>
        <p><b>ATTACKS</b></p>
        <ul>
            ${cardInfo.attack1 ? `<li>${cardInfo.attack1}</li>` : ""}
            ${cardInfo.attack2 ? `<li>${cardInfo.attack2}</li>` : ""}
            ${cardInfo.attack3 ? `<li>${cardInfo.attack3}</li>` : ""}
            ${cardInfo.attack4 ? `<li>${cardInfo.attack4}</li>` : ""}
        </ul>`;
  }
  return html;
}

async function fetchWithFallback(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (url.startsWith('https://raw.githubusercontent.com/finmap-org/')) {
      const fallbackUrl = url.replace('https://raw.githubusercontent.com/finmap-org/', 'https://data.finmap.org/');
      console.warn(`Primary fetch failed for ${url}, attempting fallback: ${fallbackUrl}`, error);
      const fallbackResponse = await fetch(fallbackUrl);
      if (!fallbackResponse.ok) {
        throw new Error(`Fallback HTTP ${fallbackResponse.status}: ${fallbackResponse.statusText}`);
      }
      return fallbackResponse;
    }
    throw error;
  }
}

async function renderTreemap() {
  const urlParams = new URLSearchParams(window.location.search);
  const productLineName = urlParams.get("productLine") || "pokemon";

  let rawDatafile;
  try {
    const url = `https://raw.githubusercontent.com/finmap-org/data-tcg/refs/heads/main/marketdata/raw/${productLineName}.json`;
    const response = await fetchWithFallback(url);
    rawDatafile = await response.json();
  } catch (error) {
    console.error("Error loading raw datafile:", error);
  }

  const treemap = new Treemap("container", productLineName, rawDatafile.results[0].results);

  try {
    const url = `https://raw.githubusercontent.com/finmap-org/data-tcg/refs/heads/main/marketdata/${productLineName}.json`;
    const response = await fetchWithFallback(url);
    const data = await response.json();

    const transformedData = treemap.transformData(data);
    const root = d3
      .hierarchy(transformedData)
      .sum((d) => (d.type === "sector" ? 0 : d.value))
      .sort((a, b) => b.value - a.value);

    treemap.path = [root];
    treemap.renderFromNode(root);
  } catch (error) {
    console.error("Error loading or processing data:", error);
  } finally {
    // const loadingDiv = document.getElementById("loadingDiv");
    // treemap.container.removeChild(loadingDiv);
  }
}

renderTreemap();
