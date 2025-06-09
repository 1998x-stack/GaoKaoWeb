document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('cards-container');
    const filterOptions = document.querySelectorAll('.filter-option');
    
    // Function to create a card
    function createCard(section) {
        const card = document.createElement('div');
        card.className = `card ${section.category}`;
        card.dataset.category = section.category;
        
        // Card header with icon
        const header = document.createElement('div');
        header.className = 'card-header';
        
        const icon = document.createElement('div');
        icon.className = 'card-icon';
        icon.style.backgroundColor = section.iconColor;
        icon.innerHTML = `<i class="fas ${section.icon}"></i>`;
        
        const title = document.createElement('div');
        title.className = 'card-title';
        title.textContent = section.title;
        
        header.appendChild(icon);
        header.appendChild(title);
        card.appendChild(header);
        
        // Card content
        const content = document.createElement('div');
        content.className = 'card-content';
        
        if (section.content && section.content.length > 0) {
            section.content.forEach(contentSection => {
                const sectionDiv = document.createElement('div');
                sectionDiv.className = 'card-section';
                
                const sectionTitle = document.createElement('div');
                sectionTitle.className = 'card-section-title';
                sectionTitle.innerHTML = `<i class="fas fa-circle"></i> ${contentSection.title}`;
                sectionDiv.appendChild(sectionTitle);
                
                if (contentSection.items && contentSection.items.length > 0) {
                    const list = document.createElement('ul');
                    list.className = 'card-list';
                    
                    contentSection.items.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        list.appendChild(li);
                    });
                    
                    sectionDiv.appendChild(list);
                }
                
                content.appendChild(sectionDiv);
            });
        }
        
        // Children sections with collapsible functionality
        if (section.children && section.children.length > 0) {
            section.children.forEach(child => {
                const childSection = document.createElement('div');
                childSection.className = 'card-section child-section';
                
                let childTitle = child.title;
                if (child.level) {
                    childTitle = `<span class="ability-level ability-${child.level}">${child.level}</span> ${child.title}`;
                }
                
                // Create collapsible header
                const sectionHeader = document.createElement('div');
                sectionHeader.className = 'child-header collapsible';
                
                // Add chevron icon for toggle
                const chevron = document.createElement('i');
                chevron.className = 'fas fa-chevron-down collapsible-icon';
                sectionHeader.appendChild(chevron);
                
                const sectionTitle = document.createElement('div');
                sectionTitle.className = 'card-section-title collapsible-title';
                sectionTitle.innerHTML = childTitle;
                sectionHeader.appendChild(sectionTitle);
                
                childSection.appendChild(sectionHeader);
                
                // Create content container
                const contentContainer = document.createElement('div');
                contentContainer.className = 'collapsible-content';
                contentContainer.style.display = 'block'; // Default to expanded
                
                // Child items
                if (child.items && child.items.length > 0) {
                    const list = document.createElement('ul');
                    list.className = 'card-list';
                    
                    child.items.forEach(item => {
                        const li = document.createElement('li');
                        li.textContent = item;
                        list.appendChild(li);
                    });
                    
                    contentContainer.appendChild(list);
                }
                
                // Child content (if any)
                if (child.content && child.content.length > 0) {
                    child.content.forEach(subSection => {
                        const subSectionDiv = document.createElement('div');
                        subSectionDiv.style.marginTop = '10px';
                        
                        const subTitle = document.createElement('div');
                        subTitle.className = 'card-section-title';
                        subTitle.style.fontSize = '0.95rem';
                        subTitle.innerHTML = `<i class="fas fa-circle-small"></i> ${subSection.title}`;
                        subSectionDiv.appendChild(subTitle);
                        
                        if (subSection.items && subSection.items.length > 0) {
                            const subList = document.createElement('ul');
                            subList.className = 'card-list';
                            subList.style.paddingLeft = '25px';
                            
                            subSection.items.forEach(item => {
                                const li = document.createElement('li');
                                li.textContent = item;
                                subList.appendChild(li);
                            });
                            
                            subSectionDiv.appendChild(subList);
                        }
                        
                        contentContainer.appendChild(subSectionDiv);
                    });
                }
                
                childSection.appendChild(contentContainer);
                
                // Add click event for collapsible
                sectionHeader.addEventListener('click', () => {
                    const isExpanded = contentContainer.style.display === 'block';
                    contentContainer.style.display = isExpanded ? 'none' : 'block';
                    chevron.className = isExpanded 
                        ? 'fas fa-chevron-right collapsible-icon' 
                        : 'fas fa-chevron-down collapsible-icon';
                });
                
                content.appendChild(childSection);
            });
        }
        
        card.appendChild(content);
        
        // Card footer
        if (section.footer) {
            const footer = document.createElement('div');
            footer.className = 'card-footer';
            footer.textContent = section.footer;
            card.appendChild(footer);
        }
        
        return card;
    }
    
    // Function to render all cards
    function renderCards(filter = 'all') {
        container.innerHTML = '';
        
        syllabusData.forEach(section => {
            if (filter === 'all' || filter === section.category) {
                const card = createCard(section);
                container.appendChild(card);
            }
        });
    }
    
    // Initial render
    renderCards();
    
    // Filter functionality
    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            filterOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            renderCards(option.dataset.filter);
        });
    });
});