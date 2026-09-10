# Design direction — Swiss Editorial × Institutional Data Modernism

This is the standing brief for every UI change on esbpowerline.com, written by Hamim
on 2026-09-11. It is a constitution, not a task list: a one-line hover fix is bound
by it as much as a homepage rebuild. Read it before touching anything a reader sees.

**How it is to be executed — agreed 2026-09-11, and the part the brief itself
leaves open:**

- **Not in one pass.** The 2026-09-02 Grid Explorer redesign was rejected outright
  (serif/mono split, cards→ruled sections, a "dispatch ledger" instrument); the
  branch was deleted. Its constraints were never the complaint — its *taste* was.
  So: reference designs from Hamim first, then §41's layers one at a time, each
  rendered and looked at (§42) before the next begins. Fan-outs across the whole
  site have died on session limits every time they were tried here.
- **First slice is §41 steps 1–5** — foundation, canvas, typography, header,
  homepage. That fixes the language everything else inherits.
- **§17 (maps), §18–19 (time comparison, event overlays) and §37 (drill-down to
  substation / unit) are product backlog, not redesign.** The data and UI do not
  exist; the substation sheet is dropped at parse time. Building them under a
  restyle brief is how invented content gets in.
- **§4 collides with a protected contract.** The homepage snapshot is a fixed 2×6
  panel pinned by tests, with doctrine rules 1–3 in CLAUDE.md written around it.
  Replacing it with one data strip may be right, but it is Hamim's decision to make
  explicitly, not a side effect of "reduce cardification".
- **The data doctrine outranks this document** wherever the two touch. §14
  (provenance) is the visual form of `null` is not zero, `awaiting`, `sourceFiles`
  and the `verify:data` severities; §12's "+4.2% YoY" is fine, grading a forecast
  (doctrine rule 6) is not.

Everything below is Hamim's text, verbatim.

---

You are redesigning the existing ESB Powerline website.

Your role is not simply "frontend developer."

Act as a combined:

* senior product designer
* editorial art director
* information designer
* data visualization designer
* UX architect
* design systems lead
* frontend engineer

The website must be redesigned into a highly credible, mature, restrained electricity and energy information platform.

The visual direction is:

# Swiss Editorial × Institutional Data Modernism

This means:

**rigorous editorial composition + strong typography + structured information density + modern analytical UX + restrained visual design**

The website should feel like it was designed by a serious editorial and data-product team rather than generated from a prompt.

---

# FIRST PRINCIPLE

Do not redesign ESB Powerline into:

* a SaaS dashboard
* a fintech dashboard
* a startup landing page
* a crypto website
* a Dribbble concept
* a Tailwind component showcase
* a futuristic control room
* a glassmorphism interface
* a Vercel/Linear imitation
* an AI-generated "premium" website

Avoid the usual AI design vocabulary:

* giant hero text for no reason
* glowing gradients
* floating cards everywhere
* excessive border radius
* excessive shadows
* glass panels
* random abstract blobs
* neon accents
* excessive bento layouts
* animated background particles
* arbitrary gradients
* huge empty spaces
* unnecessary badges
* unnecessary icons
* excessive section containers
* every number inside its own KPI card
* animations whose only purpose is to make things move

If something can look better by removing an element rather than adding one, strongly prefer removal.

---

# WHAT ESB POWERLINE SHOULD FEEL LIKE

ESB Powerline should feel like an independent Bangladesh electricity and energy information institution.

It combines:

* journalism
* analysis
* historical information
* power-sector data
* interactive data exploration
* policy coverage
* energy-sector documentation
* public information
* Grid Explorer
* eventually consumer-facing energy intelligence

The interface should communicate:

**authority**
**clarity**
**evidence**
**accuracy**
**structure**
**editorial judgment**
**technical competence**
**restraint**

It should never visually exaggerate its importance.

Credibility should come from information design.

---

# CORE VISUAL PHILOSOPHY

Make the website feel like:

**a serious publication that gradually becomes an analytical instrument as the user goes deeper into the data.**

The editorial pages and data interfaces must share one visual language.

Do not make Powerline and Grid Explorer feel like two separate products.

The transition should feel natural:

Journalism
→ evidence
→ data
→ historical context
→ exploration
→ source documentation

---

# 1. BUILD THE DESIGN AROUND TYPOGRAPHY

Typography should carry more of the interface than containers, cards, shadows or colour.

Create a clear hierarchy for:

* masthead
* navigation
* section labels
* H1
* H2
* H3
* article titles
* article summaries
* body copy
* captions
* metadata
* timestamps
* chart labels
* numerical data
* table data
* footnotes
* source labels
* methodology text
* UI controls

Do not make everything bold.

Do not use oversized typography merely because modern websites often do.

Large text should indicate genuine editorial importance.

Body text must have:

* comfortable line length
* excellent line height
* strong readability
* sensible paragraph rhythm

For numerical interfaces:

use typography optimized for comparing numbers.

Where supported, use tabular numerals for:

* MW
* MWh
* percentages
* dates
* tariff values
* generation numbers
* demand
* imports
* frequency
* load shedding
* prices
* deltas

Numbers should align naturally.

---

# 2. CREATE A RIGOROUS GRID

Use a disciplined layout system.

Desktop should be based on a strong multi-column grid, preferably a 12-column foundation where appropriate.

The grid should govern:

* masthead
* navigation
* headlines
* article layouts
* article lists
* visualizations
* metadata
* charts
* filters
* sidebars
* explanatory content
* source information

Elements across unrelated sections should still appear to align.

This invisible alignment is one of the main things that should make the website feel professionally art-directed.

Avoid arbitrary container widths.

Define intentional widths for:

* full editorial canvas
* article body
* wide analysis
* visualization canvas
* narrow metadata
* side columns

---

# 3. USE WHITESPACE INTELLIGENTLY

Do not interpret "premium" as "add enormous whitespace."

Whitespace must indicate relationships.

Related information should sit closer together.

Unrelated information should receive stronger separation.

Use spacing to communicate structure.

Develop a consistent spacing rhythm across the website.

Avoid random values everywhere.

At the same time, do not force every spacing value into one rigid mathematical scale if optical adjustment produces a better composition.

Human visual balance is more important than theoretical purity.

---

# 4. REDUCE CARDIFICATION

Audit every card.

Ask:

**Does this information actually require a container?**

If not, remove the card.

Prefer:

* typography
* alignment
* whitespace
* thin dividers
* column structure
* subtle background changes

over:

* rounded boxes
* shadows
* floating panels

Related metrics should often be grouped into one analytical composition rather than several independent cards.

For example, instead of:

[ Demand ]
[ Generation ]
[ Import ]
[ Load Shedding ]

consider one coherent data strip or analytical block where relationships between the values become visible.

Cards should have a functional reason to exist.

---

# 5. RESTRAIN BORDER RADIUS

Do not make everything rounded.

Use:

* square edges
* very small radius
* modest radius only where interaction or containment requires it

Buttons, inputs and dropdowns may have controlled radius.

Large editorial sections should generally not look like rounded app widgets.

Avoid pill-shaped elements unless the element is genuinely:

* a status
* tag
* filter
* segmented control
* categorical label

Do not turn normal navigation into pills.

---

# 6. SHADOWS SHOULD BE RARE

Do not use shadows as decoration.

Use elevation only when something genuinely exists above another interface layer:

* dropdown
* menu
* tooltip
* popover
* modal
* floating contextual control

Normal:

* cards
* articles
* charts
* sections
* tables

should generally not float above the page.

---

# 7. COLOR MUST HAVE MEANING

Create a restrained colour system.

The website should mostly operate through:

* paper/background tone
* primary text
* secondary text
* structural lines
* ESB identity/accent colour

Then use semantic colours intentionally.

Examples:

generation types
renewables
thermal
imports
load shedding
warnings
negative values
positive values
planned outages
actual outages
estimated information
derived information
verified information

Do not use multiple accent colours merely to create visual variety.

Data visualization colours must be consistent across the entire platform.

If gas is represented by one colour in one chart, it should not randomly change elsewhere.

---

# 8. CONSIDER A SUBTLE PAPER-LIKE CANVAS

Avoid harsh pure white and pure black everywhere unless the existing branding specifically requires them.

Consider a slightly warm or neutral page background with near-black text.

The effect should be subtle.

Do NOT turn the website beige simply to imitate a newspaper.

The goal is reduced digital harshness and stronger editorial character.

---

# 9. HOMEPAGE — EDITORIAL FIRST

The homepage must immediately communicate that this is a serious electricity and energy publication.

Do not make the homepage resemble a software product landing page.

Reconsider the hierarchy from the ground up.

The homepage should answer:

1. What is the most important energy story right now?
2. What else matters?
3. What is happening in Bangladesh's electricity system?
4. What can I explore deeper?
5. What does ESB uniquely know or track?

Use editorial hierarchy.

Not every article should have equal weight.

Create clear distinctions between:

* lead story
* major stories
* secondary stories
* analysis
* policy
* data-driven reporting
* Grid Explorer entry points
* latest developments

Consider classic editorial techniques:

* asymmetric composition
* strong headline hierarchy
* restrained rules/dividers
* image scale based on story importance
* compact metadata
* structured columns

But reinterpret them for a modern digital interface.

Do not make it look like a literal printed newspaper.

---

# 10. ARTICLE PAGE

Article pages should feel exceptional.

The reading experience should be calm, credible and highly readable.

Prioritize:

* headline composition
* dek/subheading
* author information
* publication/update dates
* category
* hero media
* body typography
* figures
* tables
* citations
* source documents
* explanatory side notes
* related Grid Explorer data

Do not surround the article body with unnecessary UI.

Give reporting room to breathe.

However, introduce data context elegantly where relevant.

For example:

an article discussing peak demand could contain a contextual module linking directly into the relevant historical Grid Explorer view.

These modules should feel editorial, not promotional.

---

# 11. GRID EXPLORER — INSTITUTIONAL DATA PRODUCT

Grid Explorer should be the most sophisticated part of the platform.

Do NOT make it resemble a generic admin dashboard.

Think:

national energy observatory
+
professional analytical platform
+
data journalism interface

The information itself should become the visual experience.

Grid Explorer may appropriately be denser than the homepage.

Use professional analytical density.

Focus on:

* comparisons
* trends
* chronology
* relationships
* anomalies
* provenance
* filtering
* historical context

Do not hide useful information just to achieve minimalism.

---

# 12. GRID EXPLORER INFORMATION HIERARCHY

Users should naturally understand:

where they are
what they are viewing
which time period applies
what filters apply
where the data came from
whether the value is official, derived, estimated or historical
how it compares to previous periods

The hierarchy might conceptually behave like:

BANGLADESH

Electricity System

Demand & Generation

September 11, 2026

Peak Demand
16,240 MW
+4.2% YoY

Generation
15,680 MW

Imports
1,120 MW

Load Shedding
430 MW

---

Main visualization

---

Historical comparison

---

Regional breakdown

---

Events / context

---

Sources / methodology

This is conceptual.

Do not blindly reproduce it.

Design the best structure based on the actual content.

---

# 13. DATA VISUALIZATION

Charts must look like analytical instruments rather than decorative illustrations.

Remove unnecessary chart chrome.

Prioritize:

* readable scales
* meaningful baselines
* accurate units
* appropriate precision
* clear legends
* tooltips
* annotations
* comparison states
* event overlays
* responsive behaviour

Avoid:

* excessive gradients
* glowing chart lines
* pseudo-3D
* unnecessary area fills
* giant legends
* decorative animation
* excessive rounded chart containers

Charts should integrate naturally into the page.

Not every chart needs a card.

---

# 14. PROVENANCE MUST BECOME PART OF THE DESIGN

This is important.

ESB should visibly communicate where data came from.

Design an elegant provenance language for:

* LIVE
* OFFICIAL STRUCTURED
* OFFICIAL PDF
* MANUAL
* HISTORICAL
* SCRAPED
* DERIVED
* ESTIMATED
* STATIC / MOCK
* UNKNOWN

Do not create giant colourful badges for everything.

The system should be subtle but discoverable.

Users should be able to inspect:

* source
* reporting period
* retrieval time
* methodology
* transformations
* confidence
* limitations

Trust should be visible.

---

# 15. TABLES SHOULD FEEL FIRST-CLASS

Do not treat tables as ugly fallback components.

This platform contains serious data.

Design tables carefully.

Consider:

* aligned numbers
* tabular numerals
* compact row height
* subtle separators
* sticky headers
* sensible column widths
* sorting
* filtering
* responsive strategies
* hover states
* comparative emphasis
* totals
* units

Avoid excessive background colouring.

Use emphasis sparingly.

---

# 16. FILTERS

Filters must be powerful but quiet.

Avoid giant filter cards.

Create a compact professional control language.

Filters may include:

* date
* year
* region
* utility
* fuel
* technology
* plant
* generator
* unit
* asset
* metric

Make active filters obvious without allowing the filter interface to dominate the data.

---

# 17. MAPS

Maps should feel analytical.

Avoid decorative map styling.

Prioritize:

* geographic hierarchy
* assets
* generation
* transmission
* grid zones
* utilities
* outages
* load shedding
* demand
* renewable assets

Map UI should remain quiet until the user interacts.

Information panels should be structured and proportional.

---

# 18. TIME IS A CORE DIMENSION

Grid Explorer should eventually feel like users can explore the Bangladesh electricity system through time.

Design with this in mind.

Support concepts such as:

* today
* historical period
* comparison period
* time range
* event markers
* commissioning
* outages
* policy changes
* records
* major trips
* fuel shortages
* imports
* weather events

Do not make the timeline visually excessive.

It should behave like a professional analytical control.

---

# 19. EVENT CONTEXT

Where relevant, allow charts to show contextual events:

* grid failures
* plant trips
* major maintenance
* fuel shortages
* commissioning
* shutdowns
* extreme weather
* policy changes
* tariff changes
* import disruptions
* national records

The purpose is explanation.

Not decoration.

---

# 20. NAVIGATION

Navigation should feel authoritative and effortless.

Simplify it where possible.

Avoid excessive:

* pills
* icons
* buttons
* dropdown decoration
* nested visual containers

The main information architecture should become obvious.

Powerline and Grid Explorer should have clear identities but belong to the same family.

Users should understand whether they are:

reading
exploring
searching
comparing
investigating

---

# 21. HEADER

Audit the header aggressively.

Many websites lose professionalism because the header is:

* too tall
* too crowded
* too animated
* too rounded
* overly sticky
* full of buttons
* visually heavier than the content

The ESB masthead should feel confident.

It does not need to scream.

Use proportion carefully.

---

# 22. FOOTER

Treat the footer as institutional infrastructure, not leftover space.

Organize:

* publication
* Grid Explorer
* datasets
* methodology
* about
* editorial policy
* contact
* source policy
* corrections
* privacy
* social
* copyright

Keep it structured and restrained.

---

# 23. IMAGES

Use photography as journalism.

Do not manipulate imagery excessively.

Avoid unnecessary rounded image containers.

Let important images have appropriate scale.

Captions and credits should be properly integrated.

Where possible, maintain a consistent editorial image system.

---

# 24. ICONS

Use icons only when they improve recognition.

Do not put icons next to every heading.

Avoid using icons as decoration.

Keep icon weights visually consistent with typography.

---

# 25. BUTTONS

Buttons should not dominate the page.

Establish clear hierarchy:

primary
secondary
tertiary
text action
icon action

Do not make every action a filled button.

Do not turn normal links into buttons.

Editorial websites should still behave like the web.

---

# 26. RESPONSIVE DESIGN

Do not create desktop and then collapse it.

Design responsive behaviour intentionally.

At mobile sizes:

* preserve editorial hierarchy
* retain data comprehension
* avoid horizontally impossible charts
* provide alternative chart interactions where necessary
* maintain readable typography
* keep tables usable
* avoid giant mobile cards
* ensure filters remain manageable

Information hierarchy should survive smaller screens.

---

# 27. MOTION

Motion must communicate something.

Use subtle transitions for:

* hover
* expanded states
* switching metrics
* filtering
* chart transitions
* panels
* navigation context

Avoid:

* scroll reveal everywhere
* parallax for decoration
* floating elements
* looping animations
* animated gradients
* excessive easing
* bouncing
* glowing

The website should still feel excellent if animation is disabled.

---

# 28. ACCESSIBILITY

Professional design must also be accessible.

Check:

* semantic structure
* contrast
* keyboard navigation
* focus states
* screen reader labels
* reduced motion
* chart accessibility
* table semantics
* link clarity
* form labels
* responsive font sizes

Do not sacrifice accessibility for aesthetics.

---

# 29. PERFORMANCE

Visual sophistication must not make the site slower.

Do not introduce large dependencies merely for cosmetic reasons.

Prefer:

CSS
native browser behaviour
existing libraries
lightweight components

over unnecessary animation or UI frameworks.

Do not rewrite functioning technical infrastructure unless required for the redesign.

---

# 30. PRESERVE WORKING FUNCTIONALITY

This is a redesign, not permission to destroy the application.

Before changing significant components, understand:

* what data they use
* what routes depend on them
* server/client boundaries
* existing interactions
* API contracts
* responsive behaviour
* loading states
* authorization where relevant

Do not break functionality for aesthetics.

---

# 31. DO NOT OVER-COMPONENTIZE

Do not create fifty tiny components simply because abstraction is possible.

Components should exist where there is:

* meaningful reuse
* behavioural complexity
* clear semantic responsibility
* design-system value

Avoid turning every 10 lines of JSX into a separate file.

---

# 32. CREATE A SMALL, COHERENT DESIGN FOUNDATION

Establish a practical visual foundation for:

Typography

Spacing

Containers

Colour

Borders

Radius

Controls

Tables

Data visualization

Motion

Do not build an enormous theoretical design system before building the interface.

The design system should emerge from the real product.

---

# 33. HUMAN OPTICAL JUDGMENT OVERRIDES MATHEMATICAL PURITY

Do not blindly make everything:

8px
16px
24px
32px
48px

because a spacing scale says so.

Use a consistent foundation, but apply optical correction where needed.

A 28px gap may genuinely look better than 32px.

Professional visual design is not merely token compliance.

---

# 34. IDENTIFY AND REMOVE "AI DESIGN TELLS"

As you work, constantly ask:

**Would somebody immediately guess that an AI redesigned this?**

Look for:

* identical rounded cards
* excessive centre alignment
* repetitive layout formulas
* oversized titles
* generic gradient backgrounds
* meaningless microcopy
* excessive labels
* unnecessary icons
* excessive badges
* redundant section introductions
* random animation
* perfectly symmetrical compositions everywhere
* exaggerated spacing
* dashboard cards where a table or paragraph would work better

Remove them.

Introduce natural variation where editorial hierarchy demands it.

---

# 35. DO NOT CONFUSE CONSISTENCY WITH REPETITION

The system should be consistent.

The compositions should not all be identical.

A lead story should not use the same visual structure as:

a policy analysis
a data visualization
a plant profile
a historical archive
an outage table

Shared visual language.

Different composition according to content.

---

# 36. DESIGN FOR CONTENT THAT CHANGES

Do not design only around the sample content currently visible.

Account for:

long headlines
short headlines
missing images
very large numbers
small numbers
negative values
unknown data
long source names
multiple sources
Bangla text
English text
empty datasets
loading states
errors
historical ranges

The design must survive real content.

---

# 37. GRID EXPLORER SHOULD FEEL DEEPER THE MORE YOU EXPLORE

Users should be able to conceptually move through:

BANGLADESH
↓
GRID ZONE
↓
DISTRICT / UTILITY
↓
SUBSTATION / PLANT
↓
UNIT / LINE / ASSET

The UI should support increasing specificity without becoming visually chaotic.

Context must remain visible.

Breadcrumbs, contextual headings and hierarchical navigation should be carefully designed.

---

# 38. DESIGN THE INFORMATION BEFORE DECORATING IT

For every page:

First determine:

What is the primary question?

What is the main piece of information?

What contextual information is necessary?

What can be secondary?

What should be discoverable rather than always visible?

What should the eye encounter first?

Only then style the page.

---

# 39. BEFORE IMPLEMENTATION — AUDIT

Before making major changes, inspect the current application.

Identify:

KEEP
what is already strong

REFINE
what needs visual correction

RESTRUCTURE
what needs compositional changes

REMOVE
what creates visual noise

INTRODUCE
what is genuinely missing

Also identify the root causes of the current design problems.

Do not merely list cosmetic symptoms.

---

# 40. THEN CREATE THE VISUAL DIRECTION

Before touching large portions of the application, define your intended design language.

Explain internally and then implement consistently:

* overall grid
* max widths
* typography scale
* page background
* text hierarchy
* accent system
* borders
* radii
* control styling
* article styling
* chart styling
* table styling
* navigation
* density
* responsive behaviour

Do not redesign different pages independently.

---

# 41. IMPLEMENT IN LAYERS

Work systematically.

Recommended order:

1. global design foundation
2. page canvas and containers
3. typography
4. header/navigation
5. homepage composition
6. article system
7. shared editorial components
8. Grid Explorer shell
9. metrics and analytical layouts
10. charts
11. tables
12. filters
13. maps
14. provenance/source UI
15. responsive refinement
16. interaction refinement
17. accessibility
18. final visual polish

Do not randomly modify components across the repository.

---

# 42. VISUALLY INSPECT YOUR WORK

This is mandatory.

Do not judge the redesign only by reading code.

Run the application.

Inspect rendered pages.

Check:

desktop
tablet
mobile

Look for:

misalignment
awkward whitespace
wrong proportions
oversized UI
undersized UI
line wrapping
visual imbalance
inconsistent containers
chart clipping
mobile overflow
broken tables
header problems
poor hierarchy

Continue refining based on what the page actually looks like.

---

# 43. DO NOT STOP AT "TECHNICALLY COMPLETE"

A page can be technically correct and still look mediocre.

After implementation, perform a visual refinement pass.

Ask:

What feels slightly too large?

What feels slightly too small?

What is too close?

What is too far apart?

What carries too much visual weight?

Where does the eye get stuck?

Does anything feel like a component library demo?

Would removing anything improve the composition?

Those final optical corrections matter.

---

# THE TARGET EXPERIENCE

A first-time visitor should think:

"This appears to be a serious Bangladesh energy publication."

A journalist should think:

"I can use this to understand what is happening."

An engineer should think:

"The information architecture makes sense."

A policymaker should think:

"This looks credible enough to investigate further."

A researcher should think:

"I can trace where these numbers came from."

A normal reader should think:

"I understand this without needing to be an engineer."

Someone familiar with web design should NOT think:

"This looks AI-generated."

---

# VISUAL REFERENCE IN WORDS

Think:

Swiss editorial discipline

combined with

institutional research publication

combined with

modern data journalism

combined with

professional analytical tooling.

More:

typography
structure
alignment
information
hierarchy
evidence

Less:

decoration
effects
cards
gradients
rounded surfaces
marketing language

---

# IMPORTANT — DO NOT COPY ANOTHER BRAND

Do not clone:

Financial Times
Bloomberg
Reuters
The Economist
NYT
Linear
Vercel
Stripe
Apple

Learn from the principles that make serious information products work.

Then create an identity appropriate for ESB Powerline.

ESB must eventually look recognizable as ESB.

---

# SUCCESS TEST

When you believe the redesign is complete, evaluate every major page against these questions:

Does it feel intentionally designed?

Does the hierarchy immediately make sense?

Are the proportions natural?

Does anything look unnecessarily large?

Is whitespace communicating relationships?

Are we using containers only where necessary?

Does typography do enough of the visual work?

Are data interfaces information-dense without becoming chaotic?

Are editorial interfaces readable without becoming empty?

Does colour communicate meaning?

Can users understand where data comes from?

Does mobile retain the same design quality?

Does anything still resemble generic AI-generated UI?

If the answer to the last question is yes, continue refining.

---

# FINAL RULE

Do not optimize for:

"wow, cool website."

Optimize for:

**"This feels credible, considered, useful and exceptionally well-designed."**

The strongest visual moment should often be the information itself.

When the Bangladesh grid does something unusual, the chart should become visually interesting because the EVENT is interesting.

When a major story breaks, the homepage should feel important because the STORY is important.

The design should amplify information rather than compete with it.

Proceed with the redesign using this philosophy across the actual existing application.
