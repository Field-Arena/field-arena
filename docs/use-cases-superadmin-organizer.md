# Field & Arena — Use Cases: SuperAdmin & Organizer

Prepared for QA. Documents verified, real application behavior only.

---

## Module: SuperAdmin Console

##

UC-001 — Add Organizer (Invite New Client)

**Actor(s):** SuperAdmin

**Description:** Allows a platform administrator to add a new client organization and invite its first Organizer in one step.

**Preconditions:**

* SuperAdmin is signed in and on the Organizers (Clients) screen.

**Trigger:** SuperAdmin clicks "+ Add organizer."

**Main Flow:**

1. The system opens the "Add organizer" form.

2. SuperAdmin enters the Organization Name.

3. SuperAdmin enters Contact First Name and Contact Last Name.

4. SuperAdmin optionally enters a Title and picks Governing Body Certification (FEI / USDF / USEF).

5. SuperAdmin enters the contact Email — this is where the invite goes.

6. SuperAdmin clicks "Send invite."

7. The system creates the organization, creates an account for the owner, and emails them an invite link.

8. The new organization appears in the Organizers list with status "Pending."

**Validations the system must enforce:**

* Organization name: required, 2–160 characters.

* Contact first name / last name: required, up to 80 characters each.

* Email: required, valid format.

* If the invite email itself cannot be sent, the organization is still created — an error explains that "Resend invite" must be used afterward.

**Alternative Flow:**

* Cancel: form closes, nothing is saved.

**Postconditions:** A new organization exists with status Pending. Its owner has an invite email waiting, valid for 14 days.

##

UC-002 — Enter as Organizer (Impersonate)

**Actor(s):** SuperAdmin

**Description:** Lets a platform administrator open an organization's workspace exactly as that organizer sees it, for support or setup help.

**Preconditions:**

* SuperAdmin is signed in. The target organization exists and is not deleted.

**Trigger:** SuperAdmin clicks "Enter as organizer" next to an organization.

**Main Flow:**

1. The system confirms the requester is really a SuperAdmin.

2. The system marks that organization as the one being impersonated.

3. The system opens the Organizer Workspace Dashboard.

4. A banner shows "Viewing as: [Organization Name]" with a way back to the console.

5. SuperAdmin uses every page exactly as that organization's own Organizer would.

**Validations the system must enforce:**

* Only a real SuperAdmin can start impersonation — checked on the server, not just hidden in the screen.

* The organization must exist and must not be deleted.

**Alternative Flow:**

* SuperAdmin clicks "Overview" to return to the console — impersonation ends immediately.

* If not ended manually, impersonation ends on its own after 8 hours.

**Postconditions:** SuperAdmin is viewing the organizer workspace as that organization. Every action is still recorded under the SuperAdmin's own account.

##

UC-003 — Resend Organizer Invite

**Actor(s):** SuperAdmin

**Description:** Sends a fresh invite email to an organization whose owner has never signed in yet.

**Preconditions:**

* The organization's owner has status "Pending" (has never signed in).

**Trigger:** SuperAdmin clicks "Resend invite" for that organization.

**Main Flow:**

1. The system finds the organization's owner account.

2. The system checks that the owner has not already signed in.

3. The system sends a new invite email to the same address.

4. The system confirms "Invite sent."

**Validations the system must enforce:**

* If the owner has already signed in, the system blocks it: "This organization's owner has already signed in."

* If the organization has no email on file at all, the system blocks it with an explanatory error.

**Alternative Flow:**

* If the very first invite failed and no owner account exists yet, the system creates the owner account now and sends the invite, instead of erroring.

**Postconditions:** A new invite email is sent to the same contact address. Status stays "Pending" until they set a password.

##

UC-004 — Suspend or Reactivate an Organizer

**Actor(s):** SuperAdmin

**Description:** Temporarily blocks, or restores, an organization's access without deleting anything.

**Preconditions:**

* The organization exists.

**Trigger:** SuperAdmin opens the "⋮" menu next to an organization and clicks "Suspend" (or "Reactivate").

**Main Flow:**

1. The system asks for confirmation.

2. SuperAdmin confirms.

3. The system flags the organization as suspended, or clears the flag.

4. The Organizers list updates to show the new status.

**Validations the system must enforce:**

* Confirmation is required before the flag changes.

**Alternative Flow:**

* SuperAdmin cancels the confirmation — nothing changes.

**Postconditions:** A suspended organization and its shows behave as inactive for its own users. Nothing is deleted. Reactivating restores normal access right away.

##

UC-005 — Delete an Organizer

**Actor(s):** SuperAdmin

**Description:** Hides an organization and its shows from active use, without permanently erasing any data.

**Preconditions:**

* The organization exists.

**Trigger:** SuperAdmin opens the "⋮" menu next to an organization and clicks "Delete."

**Main Flow:**

1. The system asks for confirmation, since this cannot be undone from the screen.

2. SuperAdmin confirms.

3. The system marks the organization as deleted, recording when.

4. The organization disappears from the active Organizers list.

**Validations the system must enforce:**

* Confirmation is mandatory before deleting.

**Alternative Flow:**

* SuperAdmin cancels — the organization stays active.

**Postconditions:** The organization, its shows, riders, and order history all stay in the database untouched, but read as "gone" everywhere in the app. There is no Undo button in the screen itself.

##

UC-006 — Add or Remove a Super Admin

**Actor(s):** SuperAdmin

**Description:** Grants or revokes platform-administrator access for another person.

**Preconditions:**

* SuperAdmin is signed in.

**Trigger:** SuperAdmin adds a new administrator's email, or removes an existing one.

**Main Flow:**

1. SuperAdmin enters the new administrator's email.

2. The system creates their account and emails them a set-password link.

3. The system grants SuperAdmin access immediately.

4. The new administrator shows as "Invite pending" until they sign in for the first time.

**Validations the system must enforce:**

* Email: required, valid format.

**Alternative Flow:**

* Remove: SuperAdmin selects an existing administrator and removes them — access is revoked immediately, but their account itself is not deleted.

**Postconditions:** The new person can sign in and use the SuperAdmin console once they set a password. A removed administrator can no longer reach the console.

---

## Module: Organizer Workspace

##

UC-001 — Create a New Show

**Actor(s):** Organizer (or Show Admin)

**Description:** Starts a brand-new show for the organization, ready to be configured in Show Manager.

**Preconditions:**

* Organizer is signed in and belongs to an organization.

**Trigger:** Organizer clicks "+ New Show."

**Main Flow:**

1. The system opens the New Show form.

2. Organizer enters a Show Name.

3. Organizer picks a Start Date and End Date.

4. Organizer picks at least one Discipline (Dressage, Eventing, Hunter/Jumper, Western Dressage, Quarter Horse, or Breed Show).

5. Organizer picks a Show Type (Rated or Schooling) and, optionally, Governing Bodies (USEF, USDF, FEI, USEA, or None).

6. Organizer sets the starting rider bib number, or leaves the default.

7. Organizer clicks "Create show."

8. The system creates the show and opens it directly in Show Manager → Setup.

**Validations the system must enforce:**

* Show name: required, at least 3 characters.

* End date cannot be before the start date.

* At least one discipline must be picked.

* Starting rider number: a whole number between 1 and 99999.

**Alternative Flow:**

* Cancel: form closes, nothing is created.

**Postconditions:** A new show exists in "Setup" stage, visible in the show switcher, ready for a venue, classes, and entries.

##

UC-002 — Add a Member to the Member Database

**Actor(s):** Organizer (or staff with access)

**Description:** Adds a new person — judge, volunteer, rider, vendor, and so on — to the organization's own contact list, independent of any show.

**Preconditions:**

* Organizer is on the Member Database screen.

**Trigger:** Organizer clicks "+ Add Member."

**Main Flow:**

1. The system opens the "Add member" form.

2. Organizer picks a Type (Member, Junior Rider, Adult Amateur, Judge, Volunteer, Scribe, or others).

3. Organizer enters First Name and Last Name — or a business name, if the Type is Vendor.

4. Organizer optionally enters Email, Phone, Membership status, Expiry date, and Notes.

5. Organizer clicks "Add member."

6. The system saves the record and shows it in the Member Database table.

**Validations the system must enforce:**

* A name is required — first/last name, or a business name for a Vendor. Error: "Please enter a name."

**Alternative Flow:**

* Cancel: form closes, nothing saved.

* "Upload List": imports many members at once from a spreadsheet instead of one at a time.

**Postconditions:** The person is saved in the organization's database. They are not automatically added to any show — checking them and clicking "Add to Show" is a separate step.

##

UC-003 — Add User (Invite Staff to a Show)

**Actor(s):** Organizer

**Description:** Invites someone to help run a specific show — a judge, scribe, announcer, ring steward, or general show staff — with a real email invite.

**Preconditions:**

* Organizer is on the Users screen with a show selected.

**Trigger:** Organizer clicks "+ Add User."

**Main Flow:**

1. The system opens the "Add a User" form, already scoped to the selected show.

2. Organizer enters First Name, Last Name, Email, and User Type (Show Admin, Judge, Scribe, Announcer, or ShowStaff).

3. Organizer optionally grants "Can scratch, skip, or eliminate riders" and/or "Can view financial data ($)" for this show.

4. Organizer optionally checks "Also a member of your organization."

5. Organizer clicks "Invite."

6. The system sends a real email invite and adds them to the show's staff list.

**Validations the system must enforce:**

* First name, last name: required.

* Email: required, valid format.

**Alternative Flow:**

* Cancel: closes the form, no invite sent.

**Postconditions:** The person appears on the show's staff list as "Not invited" until they accept, then "On board." If checked, they also appear in the Member Database.

##

UC-004 — Add or Edit a Venue

**Actor(s):** Organizer

**Description:** Builds, or updates, a reusable venue — name, address, contact info, ring layout, and stable/stall layout — once, so any show can reuse it.

**Preconditions:**

* Organizer is on the Venues screen.

**Trigger:** Organizer clicks "+ Add new venue" (or "Edit" on an existing one).

**Main Flow:**

1. The system opens the venue form.

2. Organizer enters Location Name, Address, Website, Phone, and Contact.

3. Organizer sets the number of rings/arenas and names/sizes each one.

4. Organizer optionally adds one or more stables and builds their stalls.

5. Organizer clicks "Save location."

6. The system saves the venue to the organization's venue library.

**Validations the system must enforce:**

* Location name: required.

**Alternative Flow:**

* Cancel: closes the form, no changes saved.

* Delete: removes the venue from the library; a show already using its layout keeps what it already copied.

**Postconditions:** The venue, with its rings and stables, is available to pick on any future show's Setup screen.

##

UC-005 — Add a Horse Manually

**Actor(s):** Organizer or show staff

**Description:** Adds a horse to a show's horse list for someone with no real class entry behind it yet — the organizer's own horse, or a staff member's.

**Preconditions:**

* Organizer is on the Horses screen for a show.

**Trigger:** Organizer clicks "+ Add Horse."

**Main Flow:**

1. The system opens the "Add a horse" form.

2. Organizer enters whose horse it is — a rider's name, or their own.

3. Organizer enters the Horse's Name.

4. Organizer optionally checks "This horse is a stallion."

5. Organizer clicks "Add horse."

6. The system adds the horse to the show's Horses list.

**Validations the system must enforce:**

* Rider name and horse name: both required.

**Alternative Flow:**

* Cancel: closes the form, nothing added.

**Postconditions:** The horse appears on the Horses list for this show, with no class entry or document requirement attached yet.

##

UC-006 — Refund a Sale

**Actor(s):** Organizer (or staff with refund permission)

**Description:** Refunds part or all of a real, paid rider entry or vendor booking through Stripe, always holding back the platform fee.

**Preconditions:**

* The sale is Paid or Partially refunded, with a real Stripe payment on file. Organizer is on Event Sales.

**Trigger:** Organizer clicks "Refund" next to a sale.

**Main Flow:**

1. The system opens the Refund dialog, defaulting to the full amount still refundable.

2. Organizer optionally lowers the amount for a partial refund.

3. Organizer clicks "Refund $X."

4. The system sends the refund to Stripe and updates the sale's status.

**Validations the system must enforce:**

* Amount must be more than $0 and no more than what is still refundable.

* "Refund" is disabled entirely once nothing is left to refund.

**Alternative Flow:**

* Cancel: closes the dialog, nothing refunded.

* If Stripe rejects the refund, the system reverses its own record and shows the real error — nothing is shown as refunded that was not actually returned.

**Postconditions:** The customer receives the refunded amount. Status updates to "Partially refunded" or "Refunded." The platform fee is never returned.

##

UC-007 — Charge an Additional Amount

**Actor(s):** Organizer (or staff with refund permission)

**Description:** Charges a saved card again after checkout — for something billed after the fact, like a stabling overage or a damage fee.

**Preconditions:**

* The sale has a saved card from checkout — a real Stripe customer and payment method on file.

**Trigger:** Organizer clicks "Charge more" next to a sale.

**Main Flow:**

1. The system opens the Charge dialog, showing anything already charged this way.

2. Organizer enters the amount to charge.

3. Organizer clicks "Charge $X."

4. The system charges the saved card off-session through Stripe.

**Validations the system must enforce:**

* Amount must be more than $0.

* "Charge more" is disabled entirely if no card was saved at checkout.

**Alternative Flow:**

* Cancel: closes the dialog, nothing charged.

* If the card declines, the system shows the real Stripe error and records nothing as charged.

**Postconditions:** The customer's saved card is charged the entered amount. The sale's "already charged this way" total goes up by that amount.
