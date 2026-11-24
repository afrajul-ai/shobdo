# EP-100: Original Project-Curated Pilot Headword List

- **Status:** Proposed Draft (Awaiting Owner Review)
- **Dataset Origin:** Original project-curated planning list (`SHOBDO` project)
- **External Dataset Used:** None (`src-wordlist` not used; no third-party frequency list or publisher syllabus copied)
- **Scope Boundary:** Headwords and intended part-of-speech planning buckets only. Contains **no** definitions, Bengali translations, IPA, example sentences, or dictionary entries. Does **not** alter `docs/governance.json` or any release gate (`D1`, `D5`, `D7`, `D10`, `release_enabled`).

## Selection Criteria & Editorial Rationale

1. **Everyday Learner Utility (West Bengal Context):** Words were selected from common daily-life domains relevant to Bengali-speaking English learners in West Bengal—school and study, home and family, food and health, travel and errands, and basic conversation.
2. **Balanced Part-of-Speech Mix:** The 100 headwords are distributed across four functional groups so pilot authoring and UI testing cover varied grammar and inflection patterns:
   - **Verbs (28):** High-frequency everyday actions, learning, and communication.
   - **Nouns (36):** Concrete school, household, community, nature, and time nouns.
   - **Adjectives (24):** Common descriptive words for states, qualities, feelings, and conditions.
   - **Adverbs, Prepositions & Connectors (12):** Everyday time, place, frequency, and linking words.
3. **Originality & Provenance Hygiene:** Curated independently for `SHOBDO` pilot planning rather than reproducing any proprietary publisher word list (such as Oxford 3000, Dolch, Fry, or NGSL) or external dataset.
4. **Separation from Dictionary Data:** This file is a planning index only. Any future dictionary entries authored from these headwords must be stored separately in `/data/entries/` and `/data/layers/` with full per-field `rights` provenance under `G2` and `LA-1` / `D5` / `D7` rules.
5. **Multiple Parts of Speech:** EP-100 assigns each headword one primary planned part of speech for pilot organisation. During entry authoring, include secondary parts of speech and common senses where they are useful to learners; do not create duplicate headwords solely because a word has multiple parts of speech.

## Headword List (100 Items)

### A. Verbs (1–28)
1. answer
2. ask
3. bring
4. build
5. buy
6. carry
7. change
8. choose
9. clean
10. close
11. cook
12. explain
13. find
14. finish
15. follow
16. forget
17. help
18. keep
19. learn
20. listen
21. open
22. practise
23. read
24. remember
25. share
26. teach
27. wait
28. write

### B. Nouns (29–64)
29. advice
30. bag
31. book
32. bread
33. bridge
34. bus
35. child
36. class
37. clock
38. cloud
39. cup
40. day
41. doctor
42. door
43. exam
44. family
45. food
46. friend
47. garden
48. home
49. hospital
50. letter
51. market
52. medicine
53. morning
54. name
55. notebook
56. paper
57. pen
58. question
59. rain
60. river
61. road
62. school
63. teacher
64. water

### C. Adjectives (65–88)
65. afraid
66. angry
67. bright
68. busy
69. calm
70. careful
71. cheap
72. clear
73. cold
74. dark
75. difficult
76. easy
77. empty
78. fresh
79. full
80. happy
81. heavy
82. honest
83. hungry
84. kind
85. loud
86. quiet
87. ready
88. warm

### D. Adverbs, Prepositions & Everyday Connectors (89–100)
89. after
90. already
91. always
92. because
93. before
94. early
95. here
96. late
97. never
98. often
99. sometimes
100. together
