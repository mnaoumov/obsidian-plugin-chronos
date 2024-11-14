# Chronos Timeline - a plugin for Obsidian

Chronos is a custom markdown syntax used for visualizing interactive timelines inline in your Obsidian notes. Timelines are styled to adapt to your Obsidian theme.

This plugin is powered by the [vis-timeline](https://www.npmjs.com/package/vis-timeline) library.

TODO: INSERT GIF

## Basic usage

# Syntax Overview

Chronos parses markdown in `chronos` code blocks

````markdown
```chronos

<your chronos timeline items here>

```
````

## Dates

- lazy dates OK

## Item types

The first character of each line in your `chronos` block determines the item type. Certain can be modified with colors and group membership (see [Modifiers](#modifiers))

### Comments (`#`)

Chronos will ignore any line that starts with `#`. You can use this to write comments to yourself or block out items.

Example

```
# this line is a comment, it will be ignored by chronos

- [1789~1799] French Revolution
- [1791~1804] Haitian Revolution
- [1776] American Declaration of Independence

# the event below will not render, since it has been commented out
# - [1939~1945] World War II

```

![comment example](./docs/ex-comment.png)

### Events (`-`)

Events can include a single date or a date range.

#### Single Date Event

```

- [Date] Event Name | Description

```

- YYYY-MM-DD: The date of the event
- Event Name (optional): The name or title of the event (optional)
- Description (optional): Shows up in a tooltip when you hover on an event

Example

#### Date Range Event:

The date range is represented with a tilde (~) between the start and end dates.

```

- [Date~Date] Event Name | Description

```

Example

#### events with descriptions

You can add additional information to an event by adding a pipe `|` after the Event name. This text will appear when you hover on an event.

Example

### Periods (`@`)

Periods represent a span of time in which multiple events occur. Periods are shown with a background color and are represented using the @ symbol. Periods can cover a broad time frame.

```

@ [YYYY-MM-DD~YYYY-MM-DD] Period Name

```

    YYYY-MM-DD~YYYY-MM-DD: The start and end dates of the period.
    Period Name: The title or name of the period.

Periods allow you to group related events and give them context by highlighting the time frame.

### Markers (`=`)

Markers are used to highlight a significant event that defines the start or end of a time period. Markers are typically placed on key dates and represent important milestones.

```
= [YYYY-MM-DD] Marker Name
```

    YYYY-MM-DD: The specific date of the marker.
    Marker Name: The title or description of the marker.

Example Timeline

```

\`\`\`chronos

- [1945-07-17] Potsdam Conference | where post-WWII Europe is divided
- [1947-03-12] Truman Doctrine | committing the U.S. to containing communism
- [1948-06-24~1949-05-12] Berlin Blockade | and Airlift in response to Soviet actions in Berlin
- [1949-04-04] Formation of NATO

@ [1947-01-01~1953-12-31] Early Cold War

- [1950-06-25~1953-07-27] Korean War | between North and South Korea
- [1955-05-14] Warsaw Pact | in response to NATO
- [1957-10-04] Sputnik launched | initiating the Space Race
- [1961-04-17] Bay of Pigs Invasion | in Cuba

@ [1953-01-01~1962-12-31] #red Height of Tensions

- [1962-10-16~1962-10-28] Cuban Missile Crisis | a peak confrontation between the U.S. and USSR
- [1963-08-05] Partial Nuclear Test Ban Treaty signed
- [1969-07-20] Apollo 11 Moon landing | U.S. wins the Space Race
- [1972-05-26] SALT I signed | first Strategic Arms Limitation Treaty

@ [1963-01-01~1979-12-31] Détente Period

- [1979-12-24~1989-02-15] Soviet-Afghan War | straining Soviet resources
- [1983-03-23] Reagan announces the Strategic Defense Initiative (SDI)
- [1986-04-26] Chernobyl nuclear disaster
- [1987-12-08] INF Treaty | signed, eliminating intermediate-range nuclear missiles

@ [1980-01-01~1989-12-31] Late Cold War

- [1989-11-09] Fall of the Berlin Wall | symbolizing the end of Cold War tensions
- [1991-07-31] START I Treaty signed | further arms reduction
- [1991-12-26] Dissolution of the Soviet Union | officially ending the Cold War

= [1991-12-26] End of the Cold War
\`\`\`

```

In this example, periods are used to group events in distinct phases (e.g., "Early Cold War," "Height of Tensions"), events have specific dates or ranges (e.g., "Potsdam Conference" on 1945-07-17, "Berlin Blockade" from 1948-06-24 to 1949-05-12), and the end of a major period is highlighted with a marker (= [1991-12-26] End of the Cold War).

### Modifiers

#### Colors `#`

This modifer can be used on:

- Events (`-`)
- Periods (`@`)

#### Groups `{}`

This modifer can be used on:

- Events (`-`)
- Periods (`@`)

## Advanced example

- colors, groups, events, markers, periods

## Actions

### Edit

### Refit
