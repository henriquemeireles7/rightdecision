# RAW FOUNDER ANSWERS — PRD (Life Decisions)

## Q1: Course delivery model
**Answer:** Web app — users log in to therightdecision.com to watch/read course content, run skills separately in Claude Cowork. Simplest to build, course + skills are separate apps.

## Q2: Time-bounded phase enforcement
**Answer:** Soft nudges — suggested timelines per phase (e.g., '3 days recommended for state mapping') with reminders, but user can proceed at their own pace. Reduces drop-off risk from pressure while still addressing the preparation trap.

## Q3: Decision primitive / Claude Cowork connection
**Answer:** "I feel like this primitive decision was something I said without thinking, I don't think it makes sense for now. The winning will be created manually by the user. If we do the decision we would need to store, to change, etc... I feel like we have two ways of doing it: we could create a page that the user can see its current decision and its files, so that somehow the user KNOWS the current decision, I feel like this is important for the methodology. But at the same time IDK if its worth the building - I feel like this should be actually understood as if makes sense or its just feature bloat"

## Q4: Decision visibility in web app
**Answer:** "I feel like we could have an onboarding capturing user information (as to know why it is using etc... - we could even capture the data when every user logs into our platform, I feel this is a great way to know our users and know which copy to use, etc... then decision could be asked here) - but at the same time, in the course we do have a first decision made in the introduction.... I feel like for now the webapp shouldn't have the decision here yet. But I think that we may need to better understand in the future how to make the connection between Claude Cowork and our platform, because MAYBE its a way to help users to do stuff - like we could make our skill call our API and post the document for each step and the user could see their docs inside our platform. my point is: does this add value?"

**Clarified decision:** V1 web app = course player + onboarding data capture + auth/payment. Decision and methodology work lives in Claude Cowork. Connection between the two is a V1.1 question.

## Q5: Onboarding as first step of methodology
**Answer:** "I would love for the onboarding to be actually the course introduction, so that the user can't see anything else before finishing the introduction. So it gives information, we capture data. It watches the first classes then we ask for its first decision - maybe we make this like more fun so that when finished the user starts with their course. I really like this idea. The onboarding as the first step of the methodology, maybe not exactly the first step, but a 'small run' like even free users would have progress into answering a few questions and get onboarded before doing the free course - also we could have a screen to sell our product BEFORE showing the free course - this would be beautiful, like a soft paywall 'no, take me to my free course'; this sounds amazing. we should def track this onboarding because it would become a metric to improve in both free users and paid users, this is huge. I love this. Also the v1 should have the winning stuff, but without comments and community, just write the winning"

## Q6: Wins Board timing
**Answer:** Milestone wins, quick wins. But they should be context-based not "I did this methodology" but "I have clarity on x" - the win is not to the practice, is to do the work.

## Q7: Wins Board display
**Answer:** Public feed — all wins from all users visible on a shared page. Anonymous (no usernames). Categorized by life area (health, relationships, career, money). New users see real wins from real people.

## Q8: Course content format
**Answer:** Video + text summary — each class is a video (hosted externally: YouTube unlisted, Vimeo, or Bunny.net) embedded in the page, plus a written summary/key takeaways below. User can watch OR read.

## Q9: Free course strategy
**Answer:** Separate free mini-course — build a distinct simplified version of the methodology as a standalone free course (doc 06 spec). Different content, different flow. Best lead gen, doubles content creation but platform work is minimal.

**Clarification:** "Remember that the free course will be inside content folder and we will do it with AI, so there is not much to do infra work, only copy. The thing is that we need to understand how is that our architecture will be used in our product - we have the content folder inside the courses folder then inside the different courses, how will the platform use this? The idea is that some stuff that we use storage we will use md files - of course videos needs to be in a real storage (or YouTube like you said)"

## Q10: Progress tracking
**Answer:** Database progress tracking — user's completion status stored in PostgreSQL. Each class has a unique ID. When user finishes a class (clicks 'mark complete' or auto-advances), it's recorded in the DB. Simple: user_id + class_id + completed_at.

## Q11: Onboarding data capture
**Answer:** Rich profile — name, email, 3 throughline questions, plus: age range, life areas they want to change (health/career/relationships/money), what they've tried before (therapy/courses/coaching/books/nothing), how long they've been stuck.

## Q12: Free user account requirements
**Answer:** "Email capture should be the last phase of the onboarding before unlocking the free course and before the soft paywall. So the user starts the onboarding and give the email later (we could A/B test not collect the email and just try to make sells later)"
