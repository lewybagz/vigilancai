import type { GuidePillar, GuideSpoke } from "@/lib/types";

/**
 * Seed content for the Guides hub.
 * `key` / `pillar_key` / `related_keys` are resolved to real UUIDs by the seed script
 * after the pillars are inserted. Everything else maps 1:1 to the DB columns.
 *
 * Content rules: truthful and general. Dollar figures are illustrative ranges and are
 * labeled as examples; no real jurisdiction's fee is quoted.
 */

export type SeedPillar = Omit<GuidePillar, "id" | "updated_at" | "related_pillar_ids"> & {
  key: string;
  related_keys: string[];
};

export type SeedSpoke = Omit<GuideSpoke, "id" | "pillar_id" | "updated_at"> & {
  pillar_key: string;
};

// ---------------------------------------------------------------------------
// Pillar 1: Permit fee changes
// ---------------------------------------------------------------------------

const PERMIT_FEES_BODY = `Permit fees change on a schedule, not at random: most cities and counties revise their building fee schedules once a year as part of the budget cycle, publish the new schedule a few weeks before it takes effect, and apply it to permits **applied for** after the effective date. If you know where your jurisdictions post that schedule and when their fiscal year starts, you can see most fee increases coming a month or more ahead, price them into open bids, and stop absorbing them as a surprise line on the permit receipt.

This guide covers what actually moves inside a fee schedule, how often it moves, where the notice is posted, and a bid-protection routine that takes about twenty minutes a month. It is written for roofing, HVAC and general contractors who pull permits across more than one jurisdiction. Two companion articles go deeper: [how to read a county fee schedule](/guides/permit-fee-changes/reading-a-county-fee-schedule) walks through a real schedule line by line, and [Arizona ROC licensing changes](/guides/permit-fee-changes/arizona-roc-licensing-changes) covers the state-level rules that change alongside local fees. If material costs are the bigger risk on your bids, start with [roofing material price increases](/guides/roofing-material-price-increases) instead.

## What is a permit fee, and what is bundled into it?

A "permit fee" on a receipt is almost never one number. It is a stack of separately calculated charges that the permit counter totals for you. The pieces most trades see:

- **Base permit fee.** Either a flat amount by permit type (a re-roof, a like-for-like HVAC changeout) or a valuation-based fee that scales with the declared job value.
- **Plan review fee.** Usually a percentage of the base fee, charged when drawings are required. Many jurisdictions waive it for over-the-counter permits.
- **Technology, records or automation surcharge.** A small percentage or flat amount that funds the permitting software. These are the fees most likely to be added quietly.
- **State or regional surcharges.** Some states add a training, seismic, energy or building-standards surcharge that is collected locally and passed through.
- **Inspection fees.** Sometimes included in the base fee, sometimes billed per inspection, and almost always billed separately for re-inspections.
- **Impact and utility fees.** Rarely relevant to re-roofs and changeouts, but they dominate the total on additions and new construction for general contractors.

When a jurisdiction "raises permit fees," it usually adjusts one or two of these pieces, not all of them. That is why two contractors can disagree about whether fees went up: one pulls valuation-based permits and felt the change, the other pulls flat-fee changeouts and did not.

## How often do permit fees change?

Most jurisdictions update fee schedules **once a year**, tied to the fiscal year. Many U.S. cities and counties start their fiscal year on July 1, so new schedules are commonly adopted in May or June and take effect July 1. Others use October 1 or January 1. A smaller number of jurisdictions review fees every two or three years, or only when a consultant-led cost-of-service study recommends a change.

Between annual cycles, three things can still move the number you pay:

1. **Automatic indexing.** Some fee ordinances tie the schedule to a construction cost index or the consumer price index, so fees step up each year without a separate vote.
2. **Valuation table updates.** For valuation-based fees, the jurisdiction may update the per-square-foot construction cost table it uses to compute job value. Your fee rises even though the fee percentage did not.
3. **Code adoption.** When a jurisdiction adopts a new edition of the building or energy code, it often bundles a fee schedule revision into the same ordinance.

## Where are permit fee changes announced?

There is no single national source; every jurisdiction publishes its own. In practice the notice appears in one or more of these places, roughly in order of how early it shows up:

- **Council or board agendas.** A fee change requires a public vote, so it appears as an agenda item, usually with the proposed schedule attached, two to six weeks before adoption.
- **The fee schedule PDF on the building department page.** The document is replaced, often with the same filename, and the "effective" date at the top changes.
- **A notice on the permit portal login page or in the portal's news feed.**
- **An email to registered portal users**, though many jurisdictions do not send one.
- **The adopted budget document**, which lists fee changes in an appendix.

The practical problem is not that this information is hidden. It is that it lives on a dozen different pages across the jurisdictions you work in, and none of them will tell you when it changes. That is the gap a monitoring service like Vigilancai is built to close, but you can also close it by hand with the routine below.

## How much do permit fees typically increase?

Be careful with any single number here. Increases are jurisdiction-specific, and the same ordinance can raise one fee by a few percent and double another. As **illustrative examples only**: an annual indexed adjustment might move a flat re-roof permit from the low hundreds of dollars by a few percent, while a cost-of-service study that finds the department has been under-recovering can produce a one-time jump of 20 to 50 percent on plan review or a new technology surcharge of a few percent on every permit. Neither example is a real jurisdiction's fee; they are ranges to help you judge whether a change you see is routine or unusual.

The larger point: on a single re-roof or changeout, a fee increase is usually a small line. Across a hundred permits a year, a modest per-permit increase becomes a real number that came straight out of margin if none of those bids accounted for it.

## How do you protect a bid from a permit fee change?

Bids are usually written weeks before the permit is pulled, and fee changes apply to the application date, not the bid date. Four habits close most of that gap:

1. **Quote permit fees as a pass-through, not a fixed line.** Language such as "Permit and plan review fees billed at the jurisdiction's rate in effect on the date of application" keeps the fee from becoming your problem. Where local rules or the customer require a fixed number, add a small allowance.
2. **Know each jurisdiction's fiscal year.** If you are bidding in May in a July-1 jurisdiction, assume the fee will be different when you pull the permit.
3. **Keep a one-page fee cheat sheet per jurisdiction** with the effective date at the top, and refresh it when the date changes. The [county fee schedule walkthrough](/guides/permit-fee-changes/reading-a-county-fee-schedule) shows exactly what to copy onto it.
4. **Set expiration dates on estimates.** A 30-day validity window is normal and gives you a clean reason to re-quote if a schedule changed in the meantime.

## What should a monthly permit fee check look like?

For each jurisdiction where you pulled more than a handful of permits last year:

- Open the current fee schedule and confirm the effective date matches your cheat sheet.
- Skim the most recent council or board agenda for the words "fee," "schedule" or "building."
- Check the permit portal's announcements.
- Note anything scheduled to change and the date, and flag any open bids in that jurisdiction.

Done by hand, this is roughly two minutes per jurisdiction. A contractor working in eight jurisdictions can finish it in a coffee break once a month, and the two months before the fiscal year turns are the ones that matter most.

## Which trades feel permit fee changes the most?

- **Roofing** pulls the highest volume of small permits, so flat-fee and surcharge changes add up fastest. Some jurisdictions also move re-roofs between flat and valuation-based pricing, which changes the fee significantly.
- **HVAC** changeouts are often over-the-counter permits with a flat fee. The changes that hurt are new mechanical-specific inspection fees and energy-code-driven plan review requirements.
- **General contractors** carry the most valuation-based exposure. Valuation table updates and plan review percentage changes can move a single permit by more than a roofer's entire year of increases.

## Does a licensing change count as a fee change?

Not in the same schedule, but they arrive together often enough to track as one topic. State licensing boards adjust renewal fees, bonding requirements and continuing education rules on their own cycle, and a change there can affect which permits you are allowed to pull at all. The [Arizona ROC licensing changes](/guides/permit-fee-changes/arizona-roc-licensing-changes) article covers what to watch at the state level.

Permit fee changes are predictable if you know where to look. The jurisdictions publish them; the work is watching a dozen places at once and connecting what you see to the bids you have open.`;

const ROOFING_PRICES_BODY = `Roofing material prices move in announced steps, not smooth curves: manufacturers issue price-increase letters to distributors weeks before a new price takes effect, distributors pass the increase on with their own effective date, and the contractor finds out when a quote expires or an invoice comes in higher than the bid. Tracking those announcements, quoting with short validity windows, and locking material with a purchase order at contract signing is how roofers keep a profitable bid profitable between the estimate and the tear-off.

This guide explains what drives shingle, underlayment, metal and accessory pricing, how the increase cycle actually works, and where the early signals are. Two companion articles go further: [how to protect bids from material price increases](/guides/roofing-material-price-increases/how-to-protect-bids) is a step-by-step process you can adopt this week, and [manufacturer price increase letters](/guides/roofing-material-price-increases/manufacturer-price-increase-letters) explains how to read the letters themselves. If permit costs are the bigger unknown on your jobs, see [permit fee changes for contractors](/guides/permit-fee-changes).

## What drives roofing material prices?

Different products move for different reasons, which is why a single "roofing is up X percent" headline is rarely useful.

- **Asphalt shingles.** The asphalt binder is a petroleum product, so shingle pricing tracks oil and refinery output with a lag. Granules, fiberglass mat and the energy cost of manufacturing add to it. Storm seasons create regional demand spikes that show up as allocation, not just price.
- **Underlayment and ice-and-water membranes.** Synthetic underlayments follow polymer resin prices; self-adhered membranes follow both resin and asphalt.
- **Metal roofing and flashing.** Steel coil and aluminum pricing is global and volatile, and tariff and trade-policy changes can move it faster than any other roofing input.
- **Fasteners, sealants and accessories.** Small lines individually, but they move with steel, resin and freight, and distributors adjust them frequently because nobody watches them closely.
- **Freight and fuel.** Delivery surcharges are often adjusted separately from product pricing and can be added mid-quarter.

Labor is outside the scope of this guide, but note that labor availability after a storm season interacts with material allocation: both tighten at the same time.

## How often do roofing material prices go up?

In stable years, major shingle manufacturers have historically announced one or two general price increases, most often timed for the start of the spring building season and sometimes again in late summer. In volatile years, driven by petroleum swings, supply disruption or heavy storm demand, three or four increases in a twelve-month span have happened. Metal moves more often because coil pricing changes monthly.

Increases are announced by letter to distributors with an effective date typically **three to eight weeks** out. Distributors then decide how much to pass through and when. Some hold pricing on quotes already issued; most do not hold it past the quote's own expiration date.

Decreases happen, but they are rarely announced with the same fanfare. They tend to arrive as promotions, rebates or quietly lower quotes when demand softens.

## How much do roofing material prices typically increase?

Treat any specific number as an **illustrative example**, not a quote. A routine general increase from a shingle manufacturer has typically been in the mid-single-digit percentage range per announcement. Stacked across a volatile year, cumulative shingle increases in the double digits have occurred. Metal and accessories can move more sharply in either direction.

On a typical residential re-roof, materials are a large fraction of job cost. A mid-single-digit increase on materials that you did not price into the bid comes straight out of margin, and on thin-margin work it can consume most of it.

## Where are roofing price increases announced first?

In order of how early the signal shows up:

1. **Manufacturer letters to distributors.** These go out first and are the most reliable source. Distributors often forward them to contractor accounts, and some manufacturers post them on their contractor portals. The [manufacturer letters article](/guides/roofing-material-price-increases/manufacturer-price-increase-letters) explains how to read one.
2. **Distributor notices.** Your branch may email a pass-through notice with its own effective date, or post it on its online ordering portal.
3. **Trade press.** Roofing industry publications report on announced increases, usually a week or two after the letters circulate.
4. **Your own quotes.** The last place to find out, and the one most contractors rely on.

The gap between the first signal and the last is often a month. That month is when you can re-quote open bids, lock material on signed jobs, and warn customers who are still deciding.

## How do you protect a bid from a material price increase?

The short version, expanded in the [how-to article](/guides/roofing-material-price-increases/how-to-protect-bids):

- **Quote validity of 15 to 30 days**, stated plainly on the estimate.
- **A material price escalation clause** for jobs that will not start within the validity window, tied to the distributor's actual invoice rather than an index.
- **Purchase orders at signing** for jobs starting within the distributor's price-hold window, and a documented price hold from the branch where available.
- **A standing re-quote rule**: when a manufacturer letter arrives, every open bid in the affected product line is reviewed before it is signed.
- **A materials line that is visible in your job costing**, so you can see which jobs absorbed an increase and how much it cost you.

## Should you stockpile shingles ahead of a price increase?

Sometimes, and carefully. Buying ahead makes sense when the increase is confirmed, the product is a color and profile you use constantly, you have dry covered storage, and cash is not the constraint. It makes less sense when the increase is rumored rather than announced, when the material is a specialty product, or when the carrying cost and breakage risk of stored bundles exceeds the increase you are avoiding. Many roofers get the same benefit by placing a purchase order for signed jobs before the effective date and letting the distributor hold the material.

## How does this affect insurance restoration work?

Insurance estimates are usually written against a pricing database that updates periodically, and the carrier's numbers can lag the market by weeks or months after an increase. Keep the manufacturer letter and the distributor invoice; both are useful when supplementing a claim for a material cost that moved between the adjuster's estimate and the install.

## What should a monthly material price check look like?

- Skim your distributor's portal or emails for pass-through notices.
- Check the contractor portal of each manufacturer you install regularly for posted increase letters.
- Read one trade-press pricing roundup.
- Compare this month's shingle quote per square to last month's on your two most common products.
- List open bids that would be affected by an announced increase, and re-quote the ones that are not yet signed.

This is a half hour a month for most residential roofers. A monitoring tool like Vigilancai automates the first three steps and tells you which changes matter for your trade, but the discipline of re-quoting open bids is yours either way.

## Do HVAC and general contractors have the same problem?

Yes, with different inputs. HVAC equipment pricing moves with refrigerant regulation, copper and steel, and manufacturer efficiency-standard changes; general contractors carry lumber, concrete and steel exposure across much larger contract values. The mechanics, an announcement, an effective date, and a window in which to act, are the same, and the bid-protection habits transfer directly.

Material price increases are announced. The roofers who get hurt by them are the ones who hear about them last.`;

export const SEED_PILLARS: SeedPillar[] = [
  {
    key: "permit-fee-changes",
    slug: "permit-fee-changes",
    title: "Permit Fee Changes for Contractors: What Moves, When, and How to Protect Your Bids",
    primary_keyword: "permit fee changes",
    meta_description:
      "How and when cities and counties change building permit fees, where the notices are posted, and how roofing, HVAC and general contractors can keep fee increases out of their margin.",
    body_markdown: PERMIT_FEES_BODY,
    hero_image_url: null,
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "Do permit fee changes apply to permits I have already applied for?",
        answer:
          "Usually not. Most jurisdictions charge the fee schedule in effect on the date the application is accepted, so an application submitted before the effective date is priced at the old schedule even if it is issued afterward. Confirm this with the jurisdiction, because a few charge fees at issuance rather than application.",
      },
      {
        question: "Can I pass permit fee increases through to the customer?",
        answer:
          "In most residential and commercial contracts, yes, if the contract says so. Quote permit fees as a pass-through billed at the rate in effect on the application date, or include an allowance with language that the difference is reconciled at cost. If the contract fixes the permit fee, the increase is yours.",
      },
      {
        question: "How far in advance are permit fee changes announced?",
        answer:
          "Typically two to eight weeks. A fee change needs a public vote, so it appears on a council or board agenda before adoption, and the adopted schedule is usually published a few weeks before its effective date. Jurisdictions that index fees automatically may give less notice.",
      },
    ],
    status: "published",
    related_keys: ["roofing-material-price-increases"],
  },
  {
    key: "roofing-material-price-increases",
    slug: "roofing-material-price-increases",
    title: "Roofing Material Price Increases: How to Track Them and Keep Your Bids Profitable",
    primary_keyword: "roofing material price increases",
    meta_description:
      "What drives shingle, underlayment and metal price increases, how the manufacturer-to-distributor increase cycle works, and the quoting habits that keep roofing bids profitable when prices move.",
    body_markdown: ROOFING_PRICES_BODY,
    hero_image_url: null,
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "How much notice do manufacturers give before a roofing price increase?",
        answer:
          "Most manufacturer increase letters state an effective date three to eight weeks after the letter is issued. Distributors then apply their own pass-through date, which may be the same day or a little later. The window between the letter and your invoice is where re-quoting and material purchase orders protect the bid.",
      },
      {
        question: "Will my distributor honor a quote after a price increase?",
        answer:
          "Only through the quote's stated expiration date, and sometimes not even then if the quote says pricing is subject to change. Ask the branch for a written price hold on signed jobs, and place purchase orders before the effective date wherever you can.",
      },
      {
        question: "Do roofing material prices ever come back down?",
        answer:
          "Yes, but quietly. Decreases tend to show up as promotions, rebates or lower quotes when demand softens, rather than as formal letters. Comparing your per-square quote month over month on your two most common products is the simplest way to catch them.",
      },
    ],
    status: "published",
    related_keys: ["permit-fee-changes"],
  },
];

// ---------------------------------------------------------------------------
// Spokes under permit-fee-changes
// ---------------------------------------------------------------------------

const AZ_ROC_BODY = `The Arizona Registrar of Contractors (ROC) is the state agency that licenses contractors in Arizona, and its rule changes arrive through a different channel than local permit fees: statute changes from the legislature, administrative rule changes from the agency, and fee and bond adjustments published by the ROC itself. For a roofing, HVAC or general contractor in Arizona, the practical question is which of those changes affect whether you can pull a permit, what it costs to stay licensed, and what you must put on your contracts and job signs. This article is the state-level companion to [permit fee changes for contractors](/guides/permit-fee-changes), which covers the city and county side.

Nothing here is legal advice, and rules change. Treat this as a map of what to watch and where, and confirm current requirements with the ROC directly.

## What does the Arizona ROC actually regulate?

The ROC issues and renews contractor licenses by classification, sets the bond and financial requirements for each, handles complaints and disciplinary actions, and administers the Residential Contractors' Recovery Fund, which compensates homeowners harmed by licensed residential contractors. It does not issue building permits; cities and counties do that. But most Arizona jurisdictions verify an active ROC license in the correct classification before issuing a permit, so a licensing lapse or a classification mismatch stops a job at the permit counter.

Licenses are issued in commercial, residential and dual classifications. Roofing, HVAC and general contracting each have their own classification codes, and the ROC has consolidated and renamed classifications more than once over the years. Always check the current classification list rather than relying on an older code from a previous license.

## What kinds of ROC changes affect contractors?

Changes fall into a few recurring categories:

- **License and renewal fees.** The ROC sets application and renewal fees by license type. Adjustments are infrequent but do occur, and they are announced on the ROC website and in the renewal notice.
- **Bond amounts.** License bond requirements are set by classification and by the volume of work the contractor expects to do. Threshold and amount changes affect your bonding cost immediately at renewal.
- **Recovery Fund assessments.** Residential and dual licensees pay an assessment into the Recovery Fund at licensing and renewal. The assessment amount and the fund's per-claim limits can be adjusted.
- **Classification scope.** When the ROC revises what a classification covers, some work you did under one license may require a different or additional one.
- **Contract and disclosure requirements.** Arizona statute requires specific language and disclosures in residential contracts, including the licensee's name, license number and Recovery Fund notice. When these change, every contract template you use has to change.
- **Continuing education and qualifying party rules.** Requirements for the qualifying party, the person whose experience backs the license, change occasionally and can require a new exam or a replacement filing.
- **Exemption thresholds.** The handyman exemption, the dollar amount below which a license is not required, is set in statute and is periodically debated in the legislature. A change here reshapes who your competitors are on small jobs.

## How often do ROC rules change?

There is no fixed annual cycle the way local fee schedules have. In practice:

- **Statute changes** come from the Arizona legislature, which meets in regular session each year starting in January. Bills affecting contractor licensing typically take effect on the general effective date later that year, roughly ninety days after the session ends, unless the bill specifies otherwise.
- **Administrative rule changes** go through the state rulemaking process with a public comment period, and can happen at any time of year.
- **Fee, bond and Recovery Fund adjustments** are published by the ROC when adopted, often with an effective date at the start of a fiscal year or calendar year.

A reasonable expectation: something that touches your license changes every year or two, and most years it is small. The changes that matter most, a new disclosure requirement or a classification scope change, tend to get trade-association coverage before they take effect.

## Where are Arizona ROC changes announced?

- **The ROC website.** News, rulemaking notices and fee schedules are posted here. The license renewal notice you receive by mail or email is also where fee changes appear in practice.
- **The Arizona legislature's bill tracker.** Searching for bills that amend the contractor licensing title of the Arizona Revised Statutes shows you what is proposed each session, months before anything takes effect.
- **The Arizona Administrative Register.** Proposed and final rules are published here during the rulemaking process.
- **Trade associations.** Arizona roofing and HVAC contractor associations, and the state builders' association, summarize licensing changes for members and often lobby on them, so their newsletters are an early and readable signal.

## What should an Arizona contractor check, and when?

A short routine covers most of it:

1. **At license renewal.** Read the renewal notice in full. Confirm the fee, bond amount and Recovery Fund assessment match what you paid last time, and check that the classification still covers the work you do.
2. **Each January.** Look at the bills introduced that mention contractor licensing. Most die; the ones that move will be reported by your trade association by spring.
3. **When you update contract templates.** Compare your residential contract against the ROC's current list of required contract elements. This is where most compliance complaints originate.
4. **Before bidding outside your usual scope.** Confirm the classification covers it. A general contractor subcontracting roofing, or a roofer adding HVAC, is the common gap.

## How do ROC changes interact with permit fees?

Two ways. First, a lapsed or mismatched license means the permit is not issued at all, which is a larger problem than any fee increase. Second, some jurisdictions verify licensing status electronically at application, so a renewal that is late by a day can hold a permit and push its application date past a local fee change. Keeping the renewal date and your jurisdictions' fiscal-year dates on the same calendar avoids the compound problem.

## Does this apply outside Arizona?

The structure does. Most states have a licensing board with the same kinds of levers: fees, bonds, classifications, contract requirements and exemption thresholds. The sources differ, the board's website, the state register and the legislature's bill tracker, but the routine above transfers to any state that licenses contractors. Vigilancai monitors licensing sources alongside permit and material sources for exactly this reason; the change that stops a job is often not the one you were watching for.`;

const READING_FEE_SCHEDULE_BODY = `A county or city building fee schedule is a table, usually a PDF, that lists every charge the building department can assess and how each one is calculated. Reading one well takes ten minutes the first time and two minutes on every update after that, because what you are really doing is finding five things: the effective date, the fee basis, the lines that apply to your permit types, the surcharges stacked on top, and what a re-inspection costs. Once you have those on a one-page cheat sheet, a fee change is a matter of comparing the new schedule to the old one. This article is the hands-on companion to [permit fee changes for contractors](/guides/permit-fee-changes).

## What does a fee schedule look like?

Formats vary, but most schedules share a structure:

- **A header** with the adopting ordinance or resolution number and an effective date.
- **A general section** covering plan review, re-inspection, expired permit renewal, and administrative fees.
- **A building permit section**, which is either a flat-fee table by permit type or a valuation table where the fee is computed from declared job value in tiers.
- **Trade sections** for mechanical, electrical and plumbing, often flat fees per fixture, unit or appliance.
- **Surcharges** listed at the end: technology, records, state training or building-standards surcharges, expressed as a percentage or a flat amount per permit.
- **Footnotes** that carry the real rules: minimum fees, how valuation is determined, and which fees are non-refundable.

Some jurisdictions publish a separate valuation table, sometimes called a "building valuation data" table, which lists construction cost per square foot by occupancy and construction type. When your fee is valuation-based, that table matters as much as the fee schedule itself.

## How do you find the fee schedule for a jurisdiction?

Search the jurisdiction's website for "building fee schedule" or "development fee schedule." If the building department page does not link one, the adopted budget or a consolidated "master fee schedule" for the whole jurisdiction usually contains it. Permit portals often link the schedule from the application screen. If none of those turn it up, the permit counter will send it, and it is worth asking whether an update is scheduled.

Save the PDF with the effective date in the filename. When the jurisdiction replaces the file with a new one under the same name, you will have the prior version to compare.

## Which lines matter for roofing, HVAC and general contractors?

- **Roofing.** Look for a re-roof or roof covering line. It is either a flat fee, a fee per square, or "by valuation." Check whether tear-off and overlay are priced differently and whether a separate structural line applies when sheathing is replaced.
- **HVAC.** Look in the mechanical section for equipment changeout, new furnace or air handler, condensing unit, and ductwork lines. Many schedules price a like-for-like changeout as a single flat fee and everything else per unit.
- **General contractors.** Valuation-based building permit tiers, plan review as a percentage of the building fee, and impact fees on additions and new construction. The valuation table footnote explains whether the jurisdiction uses your contract value or its own per-square-foot table, whichever is higher.

## How is a valuation-based fee calculated?

Valuation tables are tiered: a base fee for the first tier of value, plus an amount per additional thousand dollars up to the next tier. As an **illustrative example only**, a table might read "for the first $2,000 of valuation, a base fee; for each additional $1,000 up to $25,000, an increment." Your job value is placed in a tier, and the fee is the base plus the increments. The jurisdiction may set the valuation itself using its per-square-foot table rather than accepting your contract price, so a valuation table update raises your fee even when the schedule is unchanged.

Plan review is usually a fixed percentage of the computed building fee. Surcharges are applied to the subtotal. Working the arithmetic once for a typical job shows you where your money actually goes and which line to watch.

## What changes between versions of a fee schedule?

When you compare an old schedule to a new one, the common changes are:

- The effective date and ordinance number.
- Flat-fee amounts, often rounded up by a few dollars or a few percent.
- Valuation tiers or increments.
- The plan review percentage.
- A new surcharge line, or an increase in an existing one.
- Re-inspection fee amounts, which tend to rise faster than base fees.
- Footnote changes, such as a new minimum fee or a change in how valuation is determined.

Reading the footnotes is where most contractors stop short. A one-line change to "valuation shall be the greater of contract price or the department's valuation table" can cost more than every flat-fee increase on the page combined.

## How should the cheat sheet be organized?

One page per jurisdiction: name, portal link, fiscal year start, schedule effective date, and then the five to eight lines you actually pay, with the current amount and the basis. Add the re-inspection fee and the surcharges. Date the sheet. When the effective date on the published schedule changes, pull the new PDF, update the sheet, and note which lines moved. Any open bid in that jurisdiction gets a second look the same day.

That is the whole process. The difficulty is not reading the schedule; it is remembering to check a dozen of them on a dozen different websites at the right time of year, which is the problem [monitoring services](/guides/permit-fee-changes) exist to solve.`;

// ---------------------------------------------------------------------------
// Spokes under roofing-material-price-increases
// ---------------------------------------------------------------------------

const PROTECT_BIDS_BODY = `A roofing bid is only as good as the material price behind it, and that price has an expiration date whether or not the bid says so. Protecting a bid from a material price increase means doing five things consistently: putting a short validity window on every estimate, adding an escalation clause for jobs that will start later, locking material with a purchase order at signing, re-quoting open bids the day an increase is announced, and tracking material cost per job so you can see what slipped through. This article is the step-by-step companion to [roofing material price increases](/guides/roofing-material-price-increases), and the steps are summarized in the list at the end.

## Why do bids lose money to material increases?

The gap is timing. A residential estimate is often written two to six weeks before signing, and the job may not start for another two to eight weeks after that. A manufacturer letter with a four-week effective date can arrive and take effect entirely inside that window. If the bid was priced on the quote you had when you wrote it, and the invoice reflects the new price, the difference comes out of margin. On a job where materials are a large share of cost and the increase is in the mid-single digits, that difference is a meaningful piece of the profit.

The second cause is silence. Most contractors find out about an increase from the invoice. By then every open bid written on the old price is already exposed.

## Step 1: Put a validity window on every estimate

State it plainly on the estimate itself: "This estimate is valid for 30 days from the date above. Material pricing beyond that date will be re-confirmed before contract." Fifteen days is common when the market is moving; thirty is typical otherwise. The window does two things. It gives you a clean, non-confrontational reason to re-quote, and it sets the customer's expectation that pricing is time-limited before an increase forces the conversation.

If your sales process uses a template, add the line to the template once. If you use estimating software, most systems support an expiration field.

## Step 2: Add a material escalation clause for later starts

For jobs that will start after the validity window, or that the customer wants to schedule months out, add a clause that lets the material line adjust to actual cost. Tie it to your distributor's invoice, not to a published index, and cap it so the customer knows the worst case. In plain language: "If the cost of roofing materials increases more than a stated percentage between the contract date and the material purchase date, the contract price will be adjusted by the documented difference, supported by the supplier invoice, up to a stated maximum."

Some states and some insurance carriers restrict escalation clauses in residential work; check your contract with someone who knows your state's rules. Where an escalation clause is not workable, the alternative is a shorter validity window plus material purchased at signing.

## Step 3: Lock material at signing

The most reliable protection is to buy the material before the increase takes effect. When the job is signed:

- Place the purchase order with your distributor for the shingles, underlayment and accessories on the estimate.
- Ask the branch for a written price hold if the delivery will be more than a week or two out. Many will hold for signed jobs; some will hold only through the quote's expiration.
- If storage allows, take delivery before the effective date. If not, confirm in writing that the PO is priced at the current schedule.

This also removes the second-largest source of margin loss on roofing jobs, which is a mid-job material substitution when the quoted product goes on allocation.

## Step 4: Re-quote open bids the day an increase is announced

Keep a list of open bids that includes the primary shingle product and the estimate date. When a manufacturer letter or distributor notice arrives, filter the list for the affected product line and validity windows that extend past the effective date. For each one:

- If the customer has not decided, send a short note: pricing changes on the effective date; the current price holds if the contract is signed before then. This is honest, not pushy, and it closes jobs.
- If the customer has signed but the job has not started, place the PO now.
- If the bid has expired, re-quote at the new price before any further conversation.

The [manufacturer letters article](/guides/roofing-material-price-increases/manufacturer-price-increase-letters) explains how to read the letter for product scope and effective date so the filter is accurate.

## Step 5: Track material cost per job

Job costing does not need to be elaborate. For each completed job, record the material line from the estimate and the material total from the invoices. The difference, positive or negative, is your material variance. Review it monthly. A pattern of small negative variances clustered around a particular month is a price increase that got through; a pattern on a particular product is a distributor adjusting quietly. Either one tells you where to tighten the process.

## How do you handle a customer who pushes back on a re-quote?

Show the letter. A manufacturer's price-increase letter, or a distributor's pass-through notice, is third-party evidence that the change is real and not something you invented. Most customers accept a documented increase without argument; the ones who do not usually respond to the option of signing before the effective date. Keep the tone factual: this is what changed, this is when, this is what it means for your project.

## Does this work for HVAC and general contractors?

Yes. HVAC equipment increases come through manufacturer letters to distributors on the same cycle, and equipment is often ordered per job, so purchase orders at signing are even more effective. General contractors carry more products and longer timelines, so escalation clauses and validity windows do more of the work. The steps are the same; only the products change.

The core of it is that a material increase is announced weeks before it costs you anything. The five steps above are how you spend those weeks.`;

const MANUFACTURER_LETTERS_BODY = `A manufacturer price-increase letter is the earliest reliable signal that roofing material costs are about to move. Manufacturers send these letters to their distributors, distributors frequently forward them to contractor accounts, and the letter states, in a page or less, which products are affected, by how much, and from what date. Learning to read one takes about two minutes and turns an abstract "prices are going up" into a specific list of open bids to revisit. This article is a companion to [roofing material price increases](/guides/roofing-material-price-increases).

## Who sends price increase letters, and to whom?

The letter is addressed from the manufacturer to its distribution partners. Contractors are not usually the direct recipient, but the letters travel: distributors forward them to explain their own pass-through notices, sales reps share them, trade associations circulate them, and some manufacturers post them on their contractor portals. Metal coil suppliers and accessory manufacturers send similar notices, sometimes as a short email rather than a formal letter.

If your distributor does not forward increase letters, ask the branch manager to add you to the list. Most are willing, because a contractor who knows an increase is coming buys before it takes effect.

## What does a price increase letter contain?

Almost every letter has the same elements, in roughly this order:

- **Date of the letter.** Note it; the gap between this and the effective date is your action window.
- **Scope.** Which product families are affected: for example, all asphalt shingle products, or specific underlayment or accessory lines. Some letters exclude certain products or regions.
- **Amount.** Expressed as a percentage, a dollar amount per square or per unit, or "up to" a percentage with details to follow on a price sheet. When the letter says "up to," the actual amount varies by product and you will need the price sheet.
- **Effective date.** The date the manufacturer's new pricing applies to distributor orders. Commonly three to eight weeks after the letter date.
- **Order and shipment rules.** Whether orders placed before the effective date ship at the old price, and whether there is a cutoff on shipment date. This line decides whether a purchase order today actually protects you.
- **Reason.** Usually a sentence about raw material, energy, freight or labor costs. Useful mainly as evidence when explaining the increase to a customer.
- **Contact.** A sales contact for questions.

## How do you read the effective date correctly?

The effective date in a manufacturer letter applies to the manufacturer's sales to the distributor. Your distributor decides when to pass the increase through to you, and that date may be the same, or a week or two later, or earlier if the branch is repricing inventory. Read the letter for the manufacturer's date, then check the distributor's own notice or ask the branch for the pass-through date. Use the earlier of the two when deciding which open bids are exposed.

Watch the order-versus-shipment rule closely. "Orders received before the effective date" protects a purchase order placed in time even if delivery is later. "Shipments after the effective date" does not; the material has to leave the manufacturer before the date, which means the distributor must already have it or be able to get it.

## What does "up to" mean in a price increase letter?

It means the manufacturer is announcing a ceiling and will publish the actual product-by-product amounts on a price sheet later. In practice, high-volume commodity products are often near the ceiling and specialty products vary. Do not re-quote on the ceiling number alone if the job uses a product that may be priced differently; ask the branch for the actual new price on your specific product.

## How do you turn a letter into a bid list?

Three fields from the letter, scope, amount and effective date, are all you need:

1. List open bids where the primary product falls inside the scope.
2. Keep the ones whose validity window or expected start extends past the earlier of the manufacturer's date and the distributor's pass-through date.
3. Apply the amount to the material line to estimate exposure, and decide job by job: place the PO, re-quote, or contact the customer with the deadline.

The [how-to article on protecting bids](/guides/roofing-material-price-increases/how-to-protect-bids) walks through what to do with each bid on that list.

## Should you keep price increase letters on file?

Yes. Two reasons. First, they are evidence: when a customer questions a re-quote, or when you supplement an insurance claim for material cost that changed between the adjuster's estimate and the install, the letter documents that the increase was real, announced, and dated. Second, a folder of letters over two or three years shows you the rhythm of the manufacturers you install most, which months they tend to announce, and how large the increases typically are, which makes next year's bidding easier.

## What about letters that announce decreases or promotions?

They exist, and they matter less for bid protection and more for margin. A promotional price or a rebate program with an end date is the mirror image of an increase: if you can schedule material purchases inside the window, the job earns more than it was bid at. Treat them the same way, note the scope and the dates, and check the open bid list.

The letter is the signal. Everything else in the material price cycle, the distributor notice, the trade press coverage, the higher invoice, follows it by days or weeks. Reading it well is the cheapest form of bid protection there is.`;

export const SEED_SPOKES: SeedSpoke[] = [
  {
    pillar_key: "permit-fee-changes",
    slug: "arizona-roc-licensing-changes",
    title: "Arizona ROC Licensing Changes: What Contractors Need to Watch",
    primary_keyword: "Arizona ROC licensing changes",
    meta_description:
      "What the Arizona Registrar of Contractors regulates, which rule and fee changes affect roofing, HVAC and general contractors, how often they change, and where they are announced.",
    body_markdown: AZ_ROC_BODY,
    is_how_to: false,
    how_to_steps: null,
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "Does an Arizona ROC license change affect permits I have already pulled?",
        answer:
          "Generally no. A permit already issued stays valid through its own expiration regardless of later licensing changes. The risk is at the next application: jurisdictions verify an active license in the correct classification at the counter, so a lapse or a classification mismatch stops the next permit, not the current one.",
      },
      {
        question: "Where can I confirm a rumored Arizona licensing change is real?",
        answer:
          "Check the ROC website first for news and rulemaking notices, then the Arizona legislature's bill tracker for any bill amending the contractor licensing statutes. If neither shows it, the change is either a proposal that has not moved or a misunderstanding. Trade associations are a good second source for plain-language summaries.",
      },
    ],
    status: "published",
  },
  {
    pillar_key: "permit-fee-changes",
    slug: "reading-a-county-fee-schedule",
    title: "How to Read a County Fee Schedule and Spot What Changed",
    primary_keyword: "how to read a county fee schedule",
    meta_description:
      "A step-by-step way to read a city or county building fee schedule, find the lines that apply to roofing, HVAC and general contracting permits, and compare versions to see exactly what changed.",
    body_markdown: READING_FEE_SCHEDULE_BODY,
    is_how_to: true,
    how_to_steps: [
      {
        title: "Find the current schedule and save it with its effective date",
        description:
          "Search the jurisdiction's website for the building or master fee schedule. Download the PDF and rename it with the effective date from the header so you can compare versions later.",
      },
      {
        title: "Identify the fee basis for your permit types",
        description:
          "For each permit type you pull, note whether the fee is flat, per unit or square, or valuation-based. If valuation-based, locate the valuation table and the footnote that says whether contract price or the department's table governs.",
      },
      {
        title: "Copy the lines you actually pay onto a one-page cheat sheet",
        description:
          "Record the five to eight lines that apply to your work, including plan review, re-inspection and every surcharge. Add the jurisdiction's fiscal-year start date and the portal link.",
      },
      {
        title: "Read the footnotes",
        description:
          "Minimum fees, valuation rules, non-refundable fees and expired-permit renewal charges live in the footnotes. A one-line footnote change can outweigh every flat-fee increase on the page.",
      },
      {
        title: "Compare the new schedule to the old one whenever the effective date changes",
        description:
          "Check the effective date monthly, and in the two months before the fiscal year turns. When it changes, compare line by line, update the cheat sheet, and review every open bid in that jurisdiction the same day.",
      },
    ],
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "What if the jurisdiction uses its own valuation table instead of my contract price?",
        answer:
          "Then your fee is computed from the department's per-square-foot construction cost table, usually whichever is higher of that or your declared value. Updates to that table raise your fee even when the fee schedule itself is unchanged, so save the valuation table alongside the schedule and compare both.",
      },
      {
        question: "How do I know which version of the fee schedule applies to my permit?",
        answer:
          "In most jurisdictions, the schedule in effect on the date the application is accepted applies. Check the schedule's effective date against your application date. If the two are close, confirm with the permit counter, since a few jurisdictions charge at issuance rather than application.",
      },
    ],
    status: "published",
  },
  {
    pillar_key: "roofing-material-price-increases",
    slug: "how-to-protect-bids",
    title: "How to Protect Roofing Bids from Material Price Increases",
    primary_keyword: "protect roofing bids from price increases",
    meta_description:
      "Five steps roofing contractors can adopt this week to keep material price increases from eating bid margin: validity windows, escalation clauses, purchase orders at signing, same-day re-quotes and job costing.",
    body_markdown: PROTECT_BIDS_BODY,
    is_how_to: true,
    how_to_steps: [
      {
        title: "Put a validity window on every estimate",
        description:
          "State on the estimate that pricing is valid for 15 to 30 days and will be re-confirmed before contract after that. This gives you a clean reason to re-quote and sets expectations before an increase forces the conversation.",
      },
      {
        title: "Add a material escalation clause for later starts",
        description:
          "For jobs that start after the validity window, allow the material line to adjust to the documented supplier invoice above a stated threshold, with a cap. Confirm the clause is permitted in your state and for your contract type.",
      },
      {
        title: "Lock material at signing",
        description:
          "Place the purchase order for shingles, underlayment and accessories when the contract is signed. Ask the distributor for a written price hold, and take delivery before the effective date if you can store it.",
      },
      {
        title: "Re-quote open bids the day an increase is announced",
        description:
          "Filter your open-bid list for the affected product line and validity windows past the effective date. Contact undecided customers with the deadline, place POs on signed jobs, and re-quote expired bids at the new price.",
      },
      {
        title: "Track material variance on every job",
        description:
          "Record the estimated material line against the invoiced total for each completed job. Review the variance monthly to see which increases got through and where the process needs tightening.",
      },
    ],
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "Are material escalation clauses allowed in residential roofing contracts?",
        answer:
          "In many places yes, but some states restrict them in residential work and some insurance carriers will not pay against them on restoration jobs. Have your contract reviewed for your state. Where a clause is not workable, use a shorter validity window and purchase material at signing instead.",
      },
      {
        question: "What if the customer will not sign before the price increase takes effect?",
        answer:
          "Let the estimate expire on its stated date and re-quote at the new price, with the manufacturer letter or distributor notice attached as documentation. Most customers accept a documented, third-party increase; the ones who were going to sign usually do so before the deadline once it is clear.",
      },
    ],
    status: "published",
  },
  {
    pillar_key: "roofing-material-price-increases",
    slug: "manufacturer-price-increase-letters",
    title: "Manufacturer Price Increase Letters: How to Read Them and Act Early",
    primary_keyword: "manufacturer price increase letters",
    meta_description:
      "What a roofing manufacturer's price increase letter contains, how to read the scope, amount and effective date correctly, and how to turn one into a list of open bids to revisit before the price moves.",
    body_markdown: MANUFACTURER_LETTERS_BODY,
    is_how_to: false,
    how_to_steps: null,
    published_at: "2026-09-01T00:00:00Z",
    faq: [
      {
        question: "Does the effective date in a manufacturer letter apply to my distributor pricing?",
        answer:
          "Not directly. It is the date the manufacturer's new price applies to the distributor's purchases. Your distributor sets its own pass-through date, which can be the same day, a little later, or earlier if the branch reprices inventory. Ask the branch and use the earlier of the two dates when deciding which bids are exposed.",
      },
      {
        question: "Will a purchase order placed before the effective date be honored at the old price?",
        answer:
          "It depends on the letter's order-versus-shipment rule and on your distributor's policy. If the letter protects orders received before the date, a timely PO usually holds. If it applies to shipments after the date, the material has to ship before then. Get the distributor's price hold in writing either way.",
      },
    ],
    status: "published",
  },
];
