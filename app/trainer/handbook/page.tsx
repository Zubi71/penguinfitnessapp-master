import React from 'react';
import HandbookSection from './HandbookSection';
import HandbookCard from './HandbookCard';
import HandbookChecklist from './HandbookChecklist';
import HandbookTable from './HandbookTable';

const toc = [
  { id: 'foreword', label: 'Foreword' },
  { id: 'section1', label: 'Section 1: Introduction to Penguin Fitness' },
  { id: 'section2', label: 'Section 2: Client Onboarding & First Impressions' },
  { id: 'section3', label: 'Section 3: Coaching for Specific Goals' },
  { id: 'section4', label: 'Section 4: Coaching by Age & Life Stage' },
  { id: 'section5', label: 'Section 5: Programming & Training Structure' },
  { id: 'section6', label: 'Section 6: Habit-Based Nutrition & Lifestyle Coaching' },
  { id: 'section7', label: 'Section 7: Trainer Conduct & Internal Policies' },
  { id: 'section8', label: 'Section 8: Conversion, Sales & Upselling' },
  { id: 'section9', label: 'Section 9: Case Studies & Common Scenarios' },
  { id: 'section10', label: 'Section 10: Growth & Professional Development' },
  { id: 'section11', label: 'Section 11: Appendices & Templates' },
];

const TrainerHandbook = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 text-gray-900">
      <h1 className="text-4xl font-extrabold mb-6 text-blue-900 text-center tracking-tight drop-shadow">Penguin Trainer Handbook</h1>
      {/* Table of Contents */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8 rounded shadow-sm">
        <h2 className="text-xl font-semibold mb-2 text-blue-800">Table of Contents</h2>
        <ul className="list-decimal ml-6 space-y-1 text-blue-700">
          {toc.map((item) => (
            <li key={item.id}>
              <a href={`#${item.id}`} className="hover:underline hover:text-blue-900 transition-colors duration-150">{item.label}</a>
            </li>
          ))}
        </ul>
      </div>

      {/* Foreword */}
      <HandbookSection id="foreword" title="Foreword">
        <HandbookCard type="info">
          <p className="font-semibold">Message from the Founder</p>
          <p>Welcome to Penguin Fitness! This handbook is your guide to delivering world-class coaching, building lasting client relationships, and growing as a professional. Special thanks to Head Coach Leon Lim for his leadership and expertise.</p>
        </HandbookCard>
      </HandbookSection>

      {/* Section 1: Introduction to Penguin Fitness */}
      <HandbookSection id="section1" title="Section 1: Introduction to Penguin Fitness">
        <h3 className="text-lg font-bold mt-4 mb-2">Our Mission</h3>
        <p className="mb-4">Penguin Fitness delivers precision-driven personal training and performance coaching that empowers individuals to achieve peak physical condition — integrating sports science, habit-based lifestyle design, and high-performance coaching to produce results that last beyond the gym floor.</p>
        <h3 className="text-lg font-bold mt-4 mb-2">Our Vision</h3>
        <p className="mb-4">To be Singapore’s most trusted premium fitness brand, known for transforming highly busy individuals into highly motivated individuals. We aim to help each client integrate fitness into their existing lifestyle — so health becomes a habit, not a phase.</p>
        <h3 className="text-lg font-bold mt-4 mb-2">Our Core Values</h3>
        <HandbookCard type="success">
          <ul className="list-decimal ml-6 space-y-1">
            <li><span className="font-semibold">Discipline</span> – Arrive early, lead by example, stay mission-focused.</li>
            <li><span className="font-semibold">Care</span> – Listen actively. Adapt intelligently. Never rush client progression.</li>
            <li><span className="font-semibold">Evidence-Driven Coaching</span> – Our programming is rooted in sports science — not trends, fads, or guesswork.</li>
            <li><span className="font-semibold">Client-Centred Execution</span> – Each client is a unique case. We never train everyone the same approach.</li>
            <li><span className="font-semibold">Integrity</span> – No poaching, backdoor training, or policy violations. We build trust, not shortcuts.</li>
          </ul>
        </HandbookCard>
        <h3 className="text-lg font-bold mt-4 mb-2">The Role of a Penguin Trainer</h3>
        <p className="mb-4">As a Penguin Fitness trainer, your job is not to just "conduct sessions" — it’s to build client transformation pathways. That includes:</p>
        <HandbookCard type="info">
          <ul className="list-disc ml-6 space-y-1">
            <li>Designing tailored programs with progressive structure</li>
            <li>Coaching form, tempo, recovery, and mindset</li>
            <li>Keeping records of progress, feedback, and goal adjustments</li>
            <li>Maintaining professionalism in attire, tone, and punctuality</li>
            <li>Collaborating with HQ to serve clients consistently</li>
          </ul>
        </HandbookCard>
        <p className="mb-4">Your role is to always remain mentally and logistically ready to take on new clients that fit your availability slots.</p>
      </HandbookSection>

      {/* Section 2: Client Onboarding & First Impressions */}
      <HandbookSection id="section2" title="Section 2: Client Onboarding & First Impressions">
        <h3 className="text-lg font-bold mt-4 mb-2">Why Onboarding Matters</h3>
        <p className="mb-4">First impressions drives client retention. A well-executed first session builds confidence, buy-in, and momentum. It sets the tone for professionalism, care, and progress. As a trainer, this is where you build trust  fast.</p>
        <h3 className="text-lg font-bold mt-4 mb-2">Your 4-Step Onboarding Protocol</h3>
        <HandbookCard type="info">
          <p className="font-semibold">Step 1: Receive Client Briefing from Operations</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Name, contact number, and preferred address</li>
            <li>Goals (fat loss, strength, general health, etc.)</li>
            <li>Age and key health flags (from PAR-Q)</li>
            <li>Session schedule (days & times booked)</li>
          </ul>
          <p className="mb-2">Trainers are expected to:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Review client info carefully</li>
            <li>Mentally prep a session plan 24 hours in advance</li>
            <li>Arrive 10 minutes early with equipment or gym access needs prepared</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Step 2: Pre-Session Preparation</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Draft a warm-up + 3-exercise main block based on client’s goal</li>
            <li>Prepare assessment checklist (mobility, posture, movement quality)</li>
            <li>Bring water, towel (if at client's home), resistance bands or mats if required</li>
            <li>Dress in Penguin Fitness shirt and clean athletic footwear</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Step 3: Conduct the First Training Session</p>
          <p className="mb-2">A. Rapport & Conversation (5–10 mins)</p>
          <ul className="list-disc ml-6 mb-2">
            <li>“What’s been your biggest challenge with fitness so far?”</li>
            <li>“What would you consider a success by the end of 3 months?”</li>
            <li>“Any injuries I should know about beyond what’s listed?”</li>
          </ul>
          <p className="mb-2">B. Movement Assessment (10–15 mins)</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Bodyweight squat</li>
            <li>Hip hinge (deadlift pattern or KB hinge)</li>
            <li>Push pattern (incline push-up or wall push-up)</li>
            <li>Core engagement (dead bug or front plank)</li>
            <li>Optional: gait/posture walk test or balance check</li>
          </ul>
          <p className="mb-2">C. Training Block (25–30 mins)</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Introduce 2–3 simple exercises based on findings</li>
            <li>Adjust form live and provide positive reinforcement</li>
            <li>Show them what a structured, science-based plan looks like</li>
          </ul>
          <p className="mb-2">D. Wrap Up & Confirm Next Session (5 mins)</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Recap: “You moved well today — with consistency, we’ll build strength and results fast.”</li>
            <li>Confirm the next session’s date, time, and location</li>
            <li>Let them know they’ll receive progress check-ins every 4 weeks</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Step 4: Post-Session Feedback to Operations</p>
          <p>Immediately after the session:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Send HQ a note on WhatsApp with:</li>
            <ul className="list-disc ml-10 mb-2">
              <li>Your observations (e.g. form, attitude, mobility issues)</li>
              <li>Any changes to schedule preferences</li>
              <li>Confirmation if client continues or requests changes</li>
            </ul>
          </ul>
        </HandbookCard>
        <h3 className="text-lg font-bold mt-4 mb-2">WhatsApp & Client Contact Rules</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>You may message clients for scheduling and check-ins</li>
          <li>Do not solicit clients for non-Penguin services</li>
          <li>Always maintain professional tone — avoid unnecessary emojis/slang</li>
        </ul>
      </HandbookSection>

      {/* Section 3: Coaching for Specific Goals */}
      <HandbookSection id="section3" title="Section 3: Coaching for Specific Goals">
        <HandbookCard type="info">
          <p className="font-semibold">Fat Loss Clients</p>
          <p className="mb-2">Client Type: Wants to reduce body fat, tone up, feel more confident, and improve energy</p>
          <p className="font-semibold">Common Challenges:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Sleep disruption</li>
            <li>Inconsistent meal routines</li>
            <li>Stress eating or emotional habits</li>
            <li>Obsession with the number on the scale</li>
          </ul>
          <p className="font-semibold">Programming Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Strength-based circuits (45–60 mins, 3x/week)</li>
            <li>MetCon and HIIT finishers (10–15 min blocks)</li>
            <li>LISS cardio or walking on off days</li>
            <li>Calorie awareness (not strict counting)</li>
          </ul>
          <p className="font-semibold">Key Coaching Focus:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Encourage sleep, hydration, and protein</li>
            <li>Don’t chase “burn” — build metabolic strength</li>
            <li>Reframe mindset: “Losing fat by gaining control”</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Muscle Gain Clients</p>
          <p className="mb-2">Client Type: Wants to look visibly bigger, improve strength, and build lean mass</p>
          <p className="font-semibold">Common Challenges:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Under-eating</li>
            <li>Skipping recovery days</li>
            <li>Ego lifting or poor technique</li>
            <li>Program-hopping</li>
          </ul>
          <p className="font-semibold">Programming Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Push-pull or upper/lower split training/ Full body splits</li>
            <li>Rep ranges 6–12 with controlled tempo</li>
            <li>Emphasis on progressive overload</li>
            <li>Higher frequency per muscle group (2x/week)</li>
          </ul>
          <p className="font-semibold">Key Coaching Focus:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Prioritise sleep, structured meals, and volume</li>
            <li>Correct tempo, rest periods, and posture</li>
            <li>Use progressive tracking tools (Google Sheets, training log)</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">General Fitness Clients</p>
          <p className="mb-2">Client Type: Wants to move better, improve posture, reduce pain, and feel healthier</p>
          <p className="font-semibold">Common Challenges:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Sedentary lifestyle</li>
            <li>Lower back, neck, or shoulder stiffness</li>
            <li>Low motivation from previous failed gym attempts</li>
          </ul>
          <p className="font-semibold">Programming Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Functional strength (bodyweight + light DBs)</li>
            <li>Core integration, posture drills, breathing work</li>
            <li>Mobility and stability exercises (hips, shoulders, ankles)</li>
          </ul>
          <p className="font-semibold">Key Coaching Focus:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Create wins early: energy, ease of movement, pain reduction</li>
            <li>Coach lifestyle habits (stretching, walking, posture)</li>
            <li>Avoid high complexity movements early on</li>
          </ul>
        </HandbookCard>
      </HandbookSection>

      {/* Section 4: Coaching by Age & Life Stage */}
      <HandbookSection id="section4" title="Section 4: Coaching by Age & Life Stage">
        <HandbookCard type="info">
          <p className="font-semibold">Youth Clients (Age 16–21)</p>
          <p className="mb-2">Client Type: Teenagers or young adults developing strength, confidence, or movement skills. Often new to structured fitness.</p>
          <p className="font-semibold">Typical Goals:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Gain strength and confidence</li>
            <li>Improve posture or body image</li>
            <li>Build muscle or sports performance</li>
          </ul>
          <p className="font-semibold">Training Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Movement literacy and coordination</li>
            <li>Core strength and posture awareness</li>
            <li>Progressive bodyweight and light-resistance training</li>
            <li>Emphasis on good form and safe progress</li>
          </ul>
          <p className="font-semibold">Cautions:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Avoid ego lifting or advanced techniques too early</li>
            <li>Educate rather than criticise</li>
            <li>Involve parents if the client is under 18</li>
          </ul>
          <p className="font-semibold">Coach Mindset:</p>
          <p>You’re building their foundation for life. Focus on praise, structure, and teaching.</p>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Adults (Age 22–50)</p>
          <p className="mb-2">Client Type: Professionals, parents, or lifestyle-focused individuals with limited time</p>
          <p className="font-semibold">Typical Goals:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Fat loss, muscle gain, improved energy</li>
            <li>Injury prevention, mobility, and posture</li>
            <li>Stress relief and routine building</li>
          </ul>
          <p className="font-semibold">Training Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Efficient 45–60 min sessions</li>
            <li>Split between strength and mobility</li>
            <li>Simple, progressive programming</li>
            <li>Stress-sensitive coaching</li>
          </ul>
          <p className="font-semibold">Coach Mindset:</p>
          <p>Keep it efficient, encouraging, and results-focused. Clients are often juggling careers and families — you’re their coach and anchor.</p>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Clients Aged 50–55</p>
          <p className="mb-2">Client Type: Late-career professionals, active parents, or return-to-fitness clients who may have mild chronic issues but are still highly capable and motivated.</p>
          <p className="font-semibold">Typical Goals:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Improve strength and muscle tone</li>
            <li>Prevent injuries and age-related decline</li>
            <li>Boost energy, mobility, and posture</li>
            <li>Build confidence in movement</li>
          </ul>
          <p className="font-semibold">Programming Approach:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Prioritise mobility and joint prep before intensity</li>
            <li>Introduce progressive strength with moderate resistance</li>
            <li>Include unilateral work to expose imbalances</li>
            <li>Emphasise core stability, tempo control, and movement quality</li>
          </ul>
          <p className="font-semibold">Sample Weekly Split (3x/week):</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Day 1: Full body strength</li>
            <li>Day 2: Low-impact cardio + core & mobility</li>
            <li>Day 3: Circuit training with functional movements</li>
          </ul>
          <p className="font-semibold">Watch Out For:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Prior injuries (knees, shoulders, lower back)</li>
            <li>Cardiovascular risks (check PAR-Q)</li>
            <li>Overconfidence in loads</li>
            <li>Under-recovery due to busy schedules</li>
          </ul>
          <p className="font-semibold">Coach Mindset:</p>
          <p>Train for long-term athleticism and mobility-focused resilience.</p>
          <p className="font-semibold">Sample Script:</p>
          <HandbookCard type="script">
            <p>“You’re in a great spot — we can still train hard and build strength, but the key now is quality. The better you move, the longer you stay strong.”</p>
          </HandbookCard>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Seniors (Age 55+)</p>
          <p className="mb-2">Client Type: Retirees, grandparents, or older adults returning to fitness</p>
          <p className="font-semibold">Typical Goals:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Maintain independence</li>
            <li>Prevent falls and injuries</li>
            <li>Improve balance and joint mobility</li>
            <li>Reverse sedentary effects</li>
          </ul>
          <p className="font-semibold">Training Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Low-impact, joint-safe movements</li>
            <li>Resistance band work and light dumbbells</li>
            <li>Balance drills and core strengthening</li>
            <li>Chair-assisted exercises if needed</li>
          </ul>
          <p className="font-semibold">Cautions:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Medication effects on blood pressure or balance</li>
            <li>Avoid overhead or jerky movements</li>
            <li>Prioritise safety</li>
          </ul>
          <p className="font-semibold">Coach Mindset:</p>
          <p>You’re helping them live fully, not win medals. Be patient and encouraging.</p>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Postnatal Women</p>
          <p className="mb-2">Client Type: Mothers recovering from pregnancy (within 6–18 months postpartum)</p>
          <p className="font-semibold">Typical Goals:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Rebuild core and pelvic floor strength</li>
            <li>Lose baby weight safely</li>
            <li>Regain energy and posture</li>
          </ul>
          <p className="font-semibold">Training Priorities:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Breathwork, TVA activation, pelvic stability</li>
            <li>Gradual resistance introduction</li>
            <li>Avoid high-impact or abdominal pressure exercises early on</li>
            <li>Flexibility and mobility</li>
          </ul>
          <p className="font-semibold">Cautions:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Screen for diastasis recti</li>
            <li>Progress gradually with sleep/stress awareness</li>
          </ul>
          <p className="font-semibold">Coach Mindset:</p>
          <p>This is a physical and emotional rebuild. Be gentle, smart, and consistent.</p>
        </HandbookCard>
      </HandbookSection>

      {/* Section 5: Programming & Training Structure */}
      <HandbookSection id="section5" title="Section 5: Programming & Training Structure">
        <h3 className="text-lg font-bold mt-4 mb-2">Why Programming Matters</h3>
        <p className="mb-4">Coaching must be planned, periodised, and intentional — not random or improvised.</p>
        <h3 className="text-lg font-bold mt-4 mb-2">Programming Foundations</h3>
        <ol className="list-decimal ml-6 mb-2">
          <li>Assess posture, ROM, history, and ability.</li>
          <li>Choose structure (full body, upper/lower, push/pull).</li>
          <li>Periodise in 4–6 and 8 week blocks:
            <ul className="list-disc ml-6">
              <li>Phase 1: Stability and movement literacy</li>
              <li>Phase 2: Strength progression</li>
              <li>Phase 3: Power (if applicable)</li>
              <li>Phase 4: Deload and reassess</li>
            </ul>
          </li>
        </ol>
        <h3 className="text-lg font-bold mt-4 mb-2">1-on-1 Template</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Warm-up (5–10 mins)</li>
          <li>Main strength (25–30 mins)</li>
          <li>Conditioning (10–15 mins)</li>
          <li>Cooldown (5 mins)</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Buddy PT</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Shared warm-up</li>
          <li>Supersets or paired circuits</li>
          <li>Moderate individualisation</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Group PT</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Station-based circuits</li>
          <li>Emphasise form and flow</li>
          <li>Provide attention every 2–3 rounds</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Progress Tracking</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Every 4 weeks:
            <ul className="list-disc ml-6">
              <li>Weight, photos, strength, lifestyle markers</li>
            </ul>
          </li>
          <li>Tools: Google Sheets, client logbook, progress report template</li>
        </ul>
      </HandbookSection>

      {/* Section 6: Habit-Based Nutrition & Lifestyle Coaching */}
      <HandbookSection id="section6" title="Section 6: Habit-Based Nutrition & Lifestyle Coaching">
        <h3 className="text-lg font-bold mt-4 mb-2">What We DO:</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Coach habits, not macros</li>
          <li>Promote behaviour change, not fad diets</li>
          <li>Emphasise protein, hydration, vegetables, and routine</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">What We DON’T:</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Prescribe meal plans (unless certified)</li>
          <li>Sell products or shame clients</li>
          <li>Oversimplify complex food behaviours</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Top 5 Nutrition Habits:</h3>
        <ol className="list-decimal ml-6 mb-2">
          <li>Hydration – 2–3L/day</li>
          <li>Protein – palm-sized servings per meal</li>
          <li>Veggies – 2 cups/day minimum</li>
          <li>Meal Regularity – 3 balanced meals</li>
          <li>Snack Awareness – reduce processed foods</li>
        </ol>
        <h3 className="text-lg font-bold mt-4 mb-2">Lifestyle Coaching:</h3>
        <ul className="list-disc ml-6 mb-2">
          <li>Sleep hygiene: wind-down, no screens before bed</li>
          <li>Movement: 5,000–8,000 steps daily</li>
          <li>Stress: breathing, journaling, outdoor time</li>
        </ul>
        <h3 className="text-lg font-bold mt-4 mb-2">Sample Coaching Scripts:</h3>
        <HandbookCard type="script">
          <ul className="list-disc ml-6 mb-2">
            <li>“Let’s not track calories yet — try protein at every meal.”</li>
            <li>“Your sleep and stress are key right now — let’s build from there.”</li>
            <li>“Hydration alone can boost energy and focus.”</li>
          </ul>
        </HandbookCard>
      </HandbookSection>

      {/* Section 7: Trainer Conduct & Internal Policies */}
      <HandbookSection id="section7" title="Section 7: Trainer Conduct & Internal Policies">
        <HandbookCard type="info">
          <p className="font-semibold">A. Appearance & Uniform</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Trainers must wear the official Penguin Fitness dri-fit polo shirt when coaching.</li>
            <li>Footwear must be clean, closed-toe sports shoes.</li>
            <li>Grooming must be tidy — no excessive jewellery, or casualwear.</li>
            <li>Dress appropriately when training outdoors (e.g. sun protection, sunglasses if needed).</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">B. Punctuality & Time Discipline</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Arrive at least 5-10 minutes earlier for all sessions.</li>
            <li>Respect the client’s time — do not overrun unless invited.</li>
            <li>Trainers late by more than 10 minutes without valid reason may face disciplinary action.</li>
            <li>Report emergencies to operations as early as possible.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">C. Client Communication Policy</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Use the Client Whatsapp Group Chat with the respective client for all client scheduling.</li>
            <li>Maintain a polite, neutral, and professional tone at all times.</li>
            <li>No flirting, personal talk, or boundary-crossing behavior— zero tolerance.</li>
            <li>All client complaints or incidents must be escalated immediately to operations or Head Coach.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">D. Session Cancellations & Make-Ups</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Clients must give minimum 2 hours’ notice to reschedule if not sessions will be counted as charged</li>
            <li>Late cancellations are automatically counted as used sessions.</li>
            <li>Trainers missing a session without valid reason may face deduction or reassignment.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">E. Access Cards & Security Policy</p>
          <ul className="list-disc ml-6 mb-2">
            <li>No duplication of access cards or facility keys is allowed.</li>
            <li>Misuse = police report + $15,000 penalty.</li>
            <li>Lost or damaged cards must be reported to HQ immediately*</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">F. Client Protection & Ethics</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Trainers must not poach clients or offer freelance services within/outside Penguin Fitness premises</li>
            <li>If offered private training, decline and report to HQ.</li>
            <li>Breach = immediate termination.</li>
          </ul>
        </HandbookCard>
      </HandbookSection>

      {/* Section 8: Conversion, Sales & Upselling */}
      <HandbookSection id="section8" title="Section 8: Conversion, Sales & Upselling">
        <HandbookCard type="info">
          <p className="font-semibold">A. Your Role in Sales</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Convert trial sessions, retain clients, and recommend upgrades.</li>
            <li>Know the pricing tiers and Penguin Fitness offerings.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="script">
          <p className="font-semibold">B. Trial Session Conversion Script</p>
          <ol className="list-decimal ml-6 mb-2">
            <li>Before session: Acknowledge goals and set expectations.</li>
            <li>During session: Provide small wins and visible coaching value.</li>
            <li>After session: “You did great — would you like to start planning your first 4 weeks?”</li>
          </ol>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">C. Handling Common Objections</p>
          <ul className="list-disc ml-6 mb-2">
            <li>“It’s too expensive.” → “This is a premium, results-focused service.”</li>
            <li>“I need to think about it.” → “What would help make your decision easier?”</li>
            <li>“I want to try other gyms.” → “We focus on long-term transformation. I’ll be here when you're ready.”</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">D. Upselling Opportunities</p>
          <ul className="list-disc ml-6 mb-2">
            <li>After 4 sessions: Encourage upgrade to 24 sessions.</li>
            <li>Buddy PT: Offer for friends, couples.</li>
            <li>Group PT: Suggest for social or cost-conscious clients.</li>
            <li>Swim X Fitness Bundle: Offer for families with kids learning to swim.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">E. Client Renewal Best Practices</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Track remaining sessions (especially when 2–3 left).</li>
            <li>Before sessions comes to end, draft up a plan and some stats like pictures and graphs and bodyfat percentage to review clients results and progression</li>
            <li>Move on by explaining the what is the next phase moving on and how we are going to work towards this new milestones or goals – (Give them a framework when it comes to training and goals)</li>
            <li>Follow up by “Let’s renew, it’s been great working with you and let’s continue to achieve great results together?”</li>
            <li>Use confidence and frame work, not pressure.</li>
          </ul>
        </HandbookCard>
      </HandbookSection>

      {/* Section 9: Case Studies & Common Scenarios */}
      <HandbookSection id="section9" title="Section 9: Case Studies & Common Scenarios">
        <HandbookCard type="info">
          <p className="font-semibold">Case Study 1: Busy Executive</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Male, 38. Travels often. Goal: Abs.</li>
            <li>Solution: Hotel workouts, lifestyle coaching, double up face to face personal trainings when available.</li>
            <li>Goal: Consistency &gt; perfection.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Case Study 2: Postpartum Mum</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Female, 33. Goal: Weight loss, strength.</li>
            <li>Solution: Core rehab, gentle strength, emotional support.</li>
            <li>Goal: Build confidence and safety.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Case Study 3: Senior with Knee Pain</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Male, 67. Goal: Mobility, prevent surgery.</li>
            <li>Solution: Strengthen posterior chain, low-impact movements.</li>
            <li>Goal: Maintain independence, being functional and longevity.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Case Study 4: Teen Lacking Confidence</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Male, 16. Goal: Strength, confidence.</li>
            <li>Solution: Strength wins, positive reinforcement, anti-comparison.</li>
            <li>Goal: Build confidence and self-image through gaining strength and muscles.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Case Study 5: Ghosting Client</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Any gender. Paid 10 sessions, dropped out after 2.</li>
            <li>Solution: Follow-up at 24h and 7d, offer re-engagement.</li>
            <li>Goal: Rebuild trust and re-invite, don’t guilt-trip.</li>
          </ul>
        </HandbookCard>
      </HandbookSection>

      {/* Section 10: Growth & Professional Development */}
      <HandbookSection id="section10" title="Section 10: Growth & Professional Development">
        <HandbookCard type="info">
          <p className="font-semibold">A. Monthly Trainer Evaluation</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Trainers are evaluated monthly or bi-monthly by HQ or the Head Coach based on:</li>
            <ul className="list-disc ml-10 mb-2">
              <li>Trainers overall wellbeing</li>
              <li>Client retention rate</li>
              <li>Session preparedness and delivery</li>
              <li>Punctuality and professionalism</li>
              <li>Communication tone and clarity</li>
              <li>Adherence to policies</li>
              <li>Client’s feedback</li>
              <li>Client’s progress and troubleshooting</li>
              <li>goal setting, what we can do to perform better next months</li>
              <li>Session log and progress reporting</li>
            </ul>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">B. Upskilling & Learning Culture</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Trainers are encouraged to pursue education in:</li>
            <ul className="list-disc ml-10 mb-2">
              <li>Sports science certifications (NASM, ACE, etc.)</li>
              <li>Mobility and rehab (FRC, prehab courses)</li>
              <li>Nutrition coaching (habit-based, ISSN)</li>
              <li>Soft skills (sales, communication)</li>
            </ul>
            <li>Eligible courses may be subsidised or reimbursed, this can be brought up during team meeting and will be taken into consideration on how it can benefit the team.</li>
            <li>Trainers should share learnings during team meetings or during weekly or bi-weekly team training and sharing.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">C. Career Progression at Penguin Fitness*</p>
          <HandbookTable
            headers={["Level", "Title", "Responsibilities"]}
            rows={[
              ["Junior Trainer", "Entry-level PT", "Deliver PT with support and build client experience"],
              ["Senior Trainer", "Independent Coach", "Design programmes, manage upsells, handle advanced client goals"],
              ["Lead Trainer", "Mentor Role", "Mentor juniors, host workshops, maintain quality assurance"],
              ["Partner/Manager", "Strategic Role", "Manage operations, contribute to strategy, support business growth"],
            ]}
          />
        </HandbookCard>
      </HandbookSection>

      {/* Section 11: Appendices & Templates */}
      <HandbookSection id="section11" title="Section 11: Appendices & Templates">
        <HandbookCard type="info">
          <p className="font-semibold">1. PAR-Q Form</p>
          <p>Required for all new clients before first session. Must be securely stored. Digital version available via HQ.</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Medical conditions?</li>
            <li>Medications?</li>
            <li>Joint pain or surgeries?</li>
            <li>Pregnant or postpartum?</li>
            <li>Chest pain or dizziness?</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">2. Weekly Client Session Log Template</p>
          <HandbookTable
            headers={["Date", "Focus", "Key Exercises", "Notes/Adjustments", "Client Feedback"]}
            rows={[["1 May", "Upper body", "Incline DB press, TRX row", "Reduced reps due to fatigue", "Felt stronger on rows"]]}
          />
          <p className="mt-2">Methods:</p>
          <ul className="list-disc ml-6 mb-2">
            <li>access to Fitness app, Strength Corp</li>
            <li>Access to PenguinGPT</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">3. Progress Photo Guidelines</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Photos every 4–6 weeks, consistent lighting, time of day</li>
            <li>Ladies recommended to be in sports bra and short/leggings for males top less with shorts/pants and angles (front, side, back)</li>
            <li>Store securely — never shared without permission.</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">4. Updated Price List (June 2025)</p>
          <HandbookTable
            headers={["Service", "Sessions", "Price"]}
            rows={[
              ["1-on-1 PT", "Adhoc", "$180"],
              ["1-on-1 PT", "10 sessions", "$1,500"],
              ["1-on-1 PT", "24 sessions", "$3,350"],
              ["1-on-1 PT", "36 sessions", "$4,500"],
              ["Buddy PT (2 pax)", "10 sessions", "$1,800"],
              ["Buddy PT (2 pax)", "24 sessions", "$3,500"],
              ["Group PT (3–6 pax)", "8-week (24 sessions)", "$999 (45 mins per session)"],
              ["Swim X Fitness Bundle", "8 PT + 4 swim", "$1,450"],
            ]}
          />
          <ul className="list-disc ml-6 mb-2">
            <li>Travel surcharge will be based on location</li>
            <li>Sentosa surcharge: +$50/session</li>
            <li>Family PT: Sentosa only</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">5. Contact Directory</p>
          <ul className="list-disc ml-6 mb-2">
            <li>Operations WhatsApp: +65 8337 3038</li>
            <li>Founder: Remus Teo</li>
            <li>Head Coach: Leon Lim</li>
            <li>Emergency: 995</li>
          </ul>
        </HandbookCard>
        <HandbookCard type="info">
          <p className="font-semibold">Trainer Checklist</p>
          <HandbookChecklist
            items={[
              "Confirm time/location",
              "Prepare programme",
              "Arrive 10 mins early in dri-fit Penguin T-shirt",
              "Bring required gear (bands, mat, etc.)",
              "Track performance and log weekly",
              "Review clients performance monthly",
              "Notify HQ of red flags or client wins",
            ]}
          />
        </HandbookCard>
      </HandbookSection>
    </div>
  );
};

export default TrainerHandbook;