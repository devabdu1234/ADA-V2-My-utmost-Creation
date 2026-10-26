# Algorithm Specification: Contextual Attention-Policy Engine

## 1. Problem Definition
The goal is to determine the optimal delivery action $a$ for an event $e$ given the user's current state $x$ and temporal history $h$.

## 2. Formal Scoring Model
The interrupt-worthiness score $S$ is defined as:
$$S = U + (w_{conf} \cdot C) + R + \Sigma_{soc} - F$$

### Variables:
- $U$ (Urgency): $\{Escalated: 4.0, High: 3.0, Med: 1.0, Low: 0.2\}$
- $C$ (Confidence): $\in [0, 1]$, weighted by $w_{conf} = 3.0$
- $R$ (Relevance): $\{KeywordMatch: 2.0, NoMatch: -1.5\}$
- $\Sigma_{soc}$ (Social Context): $\{MicroActivity: 1.5, None: 0\}$
- $F$ (Focus Penalty): Constant $0.5$

## 3. The $\mathcal{G}$ Gating Function
A binary gate $\mathcal{G}$ blocks delivery if any condition is True:
$$\mathcal{G} = \{ S < 6.0 \lor \neg MicroActivity \lor U < High \lor CooldownActive \lor DailyCapReached \lor MicOpen \lor ModelSpeaking \}$$

## 4. Action Mapping
The final action $a$ is mapped as follows:
- **Speak (S2S):** If $\mathcal{G} = \emptyset$
- **Defer:** If $\mathcal{G} \neq \emptyset \land S \ge 6.0$
- **Silence:** If $\mathcal{G} \neq \emptyset \land S < 6.0$

## 5. Temporal Constraints
- **Cooldown:** $T_{cooldown} = 600s$
- **Daily Budget:** $B_{max} = 5$ interruptions/day
- **VAD Threshold:** $RMS \ge 400$
