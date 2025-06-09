// 考试大纲数据
const examData = {
    abilities: [
        {
            level: 'A',
            name: '识记',
            definition: '指识别和记忆',
            levelPosition: '最基本的能力层级',
            requirements: '能识别和记忆语文基础知识、文化常识和名句名篇等',
            color: '#007AFF'
        },
        {
            level: 'B',
            name: '理解',
            definition: '指领会并能作简单的解释',
            levelPosition: '在识记基础上高一级的能力层级',
            requirements: '能够领会并解释词语、句子、段落等的意思',
            color: '#34C759'
        },
        {
            level: 'C',
            name: '分析综合',
            definition: '指分解剖析和归纳整合',
            levelPosition: '在识记和理解的基础上进一步提高了的能力层级',
            requirements: '能够筛选材料中的信息，分解剖析相关现象和问题，并予以归纳整合',
            color: '#FF9500'
        },
        {
            level: 'D',
            name: '鉴赏评价',
            definition: '指对阅读材料的鉴别、赏析和评说',
            levelPosition: '以识记、理解和分析综合为基础，在阅读方面发展了的能力层级',
            requirements: '能够鉴别、赏析和评说阅读材料的思想内容和表达技巧',
            color: '#FF3B30'
        },
        {
            level: 'E',
            name: '表达应用',
            definition: '指对语文知识和能力的运用',
            levelPosition: '以识记、理解和分析综合为基础，在表达方面发展了的能力层级',
            requirements: '能够运用语文知识和能力解决实际问题',
            color: '#AF52DE'
        },
        {
            level: 'F',
            name: '探究',
            definition: '指对某些问题进行探讨，有发现、有创见',
            levelPosition: '以识记、理解和分析综合为基础，在创新性思维方面发展了的能力层级',
            requirements: '能够探讨问题，有所发现和创见',
            color: '#FF2D92'
        }
    ],

    contentAreas: [
        {
            title: '现代文阅读',
            icon: '📖',
            description: '阅读中外现代文本，培养理解、分析、鉴赏和探究能力',
            subAreas: [
                {
                    title: '论述类文本阅读',
                    textRange: '中外论述类文本',
                    knowledgeRequirements: '了解政论文、学术论文、时评、书评等论述类文体的基本特征和主要表达方式',
                    readingPoints: '注重文本的说理性和逻辑性，分析文本的论点、论据和论证方法',
                    abilityRequirements: [
                        'B. 理解文中重要概念的含义和重要句子的含意',
                        'C. 筛选整合信息，分析文章结构，归纳要点，分析论证方法'
                    ]
                },
                {
                    title: '文学类文本阅读',
                    textRange: '中外文学作品',
                    knowledgeRequirements: '了解小说、散文、诗歌、戏剧等文学体裁的基本特征和主要表现手法',
                    readingPoints: '注重价值判断和审美体验，感受形象，品味语言，领悟内涵',
                    abilityRequirements: [
                        'B. 理解文中重要词语和句子的含意',
                        'C. 分析作品结构，概括主题，分析表现手法',
                        'D. 鉴赏语言艺术，评价价值判断',
                        'F. 探究作品意蕴和人文精神'
                    ]
                },
                {
                    title: '实用类文本阅读',
                    textRange: '中外实用类文本',
                    knowledgeRequirements: '了解新闻、传记、报告、科普文章的文体基本特征和主要表现手法',
                    readingPoints: '注重真实性和实用性，准确解读文本，筛选整合信息',
                    abilityRequirements: [
                        'B. 理解文中重要概念和句子的含意',
                        'C. 筛选整合信息，分析语言特色',
                        'D. 评价文本观点和社会价值',
                        'F. 探究人生价值和时代精神'
                    ]
                }
            ]
        },
        {
            title: '古诗文阅读',
            icon: '📜',
            description: '阅读浅易的古代诗文，传承中华优秀传统文化',
            subAreas: [
                {
                    title: '文言文阅读',
                    textRange: '浅易的古代诗文',
                    knowledgeRequirements: '掌握常见文言实词、虚词、句式和文化知识',
                    readingPoints: '理解文言现象，把握文章内容，分析思想情感',
                    abilityRequirements: [
                        'A. 默写常见的名句名篇',
                        'B. 理解文言实词、虚词和特殊句式',
                        'C. 筛选信息，归纳要点，分析观点态度',
                        'D. 鉴赏文学作品的形象、语言和表达技巧'
                    ]
                }
            ]
        },
        {
            title: '语言文字应用',
            icon: '✍️',
            description: '正确、熟练、有效地使用语言文字',
            subAreas: [
                {
                    title: '语言基础知识',
                    textRange: '现代汉语',
                    knowledgeRequirements: '掌握字音、字形、词语、句式、修辞、标点等基础知识',
                    readingPoints: '注重语言的规范性、准确性和表达效果',
                    abilityRequirements: [
                        'A. 识记字音字形',
                        'E. 正确使用词语，辨析修改病句，运用修辞手法'
                    ]
                }
            ]
        }
    ],

    writingRequirements: {
        basic: {
            title: '基础等级',
            icon: '📝',
            items: [
                '符合题意',
                '符合文体要求',
                '感情真挚，思想健康',
                '内容充实，中心明确',
                '语言通顺，结构完整',
                '标点正确，不写错别字'
            ]
        },
        advanced: {
            title: '发展等级',
            icon: '🚀',
            items: [
                '深刻：透过现象深入本质，揭示内在关系，观点具有启发作用',
                '丰富：材料丰富，论据充实，形象丰满，意境深远',
                '有文采：用语贴切，句式灵活，善于运用修辞手法，文句有表现力',
                '有创新：见解新颖，材料新鲜，构思新巧，推理想象有独到之处，有个性色彩'
            ]
        }
    }
};