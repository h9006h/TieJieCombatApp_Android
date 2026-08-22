# Data safety answers for Shelter Combat

## General

- Does the app collect or share any user data? **Yes**
- Is all user data encrypted in transit? **Yes**
- Can users request that data be deleted? **Yes**
- Account deletion URL: `https://tiejie-access.access-worker.workers.dev/account-deletion`
- Does the app allow users to create accounts? **Yes**
- Does the app provide account deletion? **Yes**

## Data types to declare

### Personal info

Data type:

- User IDs

Collected:

- Yes

Shared:

- No

Purpose:

- App functionality
- Account management
- Fraud prevention, security, and compliance

Required or optional:

- Required for account login and server progress.

### App activity

Data type:

- App interactions

Collected:

- Yes

Shared:

- No

Examples:

- Stage progress
- Resources
- Character stats
- Skills
- Allies
- Leaderboard score
- Stage validation records

Purpose:

- App functionality
- Analytics
- Fraud prevention, security, and compliance

Required or optional:

- Required for server progress and gameplay features.

### User-generated content

Data type:

- Other user-generated content

Collected:

- Yes

Shared:

- No

Examples:

- In-game feedback content submitted by the user.

Purpose:

- App functionality
- Developer communications
- Analytics

Required or optional:

- Optional. Only collected when the user submits feedback.

### Device or other IDs

Data type:

- Device or other IDs
- Advertising ID, if shown separately

Collected:

- Yes

Shared:

- Yes, with Google AdMob / Google advertising services.

Purpose:

- Advertising or marketing
- Analytics
- Fraud prevention, security, and compliance

Required or optional:

- Rewarded ads are optional, but AdMob SDK data handling should be declared.

### Approximate location

If Play Console or AdMob SDK disclosure asks for location:

- Approximate location: Yes
- Collected: Yes, by Google AdMob
- Shared: Yes, with Google AdMob / Google advertising services
- Purpose: Advertising or marketing, analytics, fraud prevention/security

The app itself does not request Android location permission.

## Data types not used

Do not select these unless you add new features:

- Precise location
- Contacts
- Photos and videos
- Audio files
- Calendar
- Health and fitness
- Financial info
- Payment info
- Call logs
- SMS or MMS
- Emails
- Web browsing history
- Crash logs or diagnostics, unless you later add a crash reporting SDK

