# Janus 
**Janus (o Jano)** es principalmente conocido en la mitología romana 
como el dios de los comienzos, los finales, las transiciones, las puertas y los portales,
caracterizado por tener dos caras para mirar al pasado y al futuro simultáneamente.


## User for Test

```

  │    User    │  Password  │    Role    │            Result             │                                                                                                                                                 
  ├────────────┼────────────┼────────────┼───────────────────────────────┤                                                                                                                                                 
  │ admin      │ admin123   │ ADMIN      │ 200 - Full access             │           
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ agent      │ agent123   │ AGENT      │ 200 - Full access             │
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ accounting │ acc123     │ ACCOUNTING │ 200 - Read-only access        │
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ client     │ client123  │ CLIENT     │ 200 - Own operations only     │
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ carrier    │ carrier123 │ CARRIER    │ 403 - Blocked from operations │
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ admin      │ wrongpass  │ —          │ 401 - Unauthorized            │
  ├────────────┼────────────┼────────────┼───────────────────────────────┤
  │ (none)     │ (none)     │ —          │ 401 - Unauthorized            │
  └────────────┴────────────┴────────────┴───────────────────────────────┘

```