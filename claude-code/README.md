# Canal Cowork ↔ Code (buzón de encargos)

Esta carpeta es el **canal** por el que se comunican Claude (Cowork) y Claude Code,
sin que Jonathan tenga que pegar prompts. Jonathan hace de **vigilante**: solo
dispara ("revisa la carpeta `claude-code` y ejecuta el PROMPT pendiente"); no
traslada el contenido.

> **Regla para Cowork (fijada por Jonathan, 03/08/2026):** TODO encargo a Code se
> hace por este canal. Cowork deja siempre un `PROMPT_NNN.md` aquí y avisa al
> vigilante; **NUNCA** pega el prompt completo en el chat. El chat solo lleva el
> aviso ("he dejado el PROMPT_NNN, dispáralo") y, de vuelta, la lectura del
> `RESULTADO_NNN.md`.

## Protocolo

1. **Cowork** deja cada encargo como `PROMPT_NNN.md` (numeración creciente, empezando
   en 001). El encargo es autocontenido: qué hacer, ficheros, verificación esperada.
2. **Jonathan (vigilante)** avisa a Code: "revisa `claude-code` y ejecuta el PROMPT
   pendiente". Nada más.
3. **Code** lee el `PROMPT_NNN.md` pendiente de número más bajo, lo ejecuta siguiendo
   `CLAUDE.md` (incluida la regla de secretos `.env`), y al terminar:
   - escribe `RESULTADO_NNN.md` (qué hizo, qué verificó, qué quedó pendiente),
   - añade la entrada correspondiente a `EJECUCIONES.md` (bitácora).
4. **Jonathan** avisa a Cowork: "Code terminó el NNN". Cowork lee el `RESULTADO_NNN.md`
   del canal y sigue.

## Reglas

- Un `PROMPT_NNN` se considera **cerrado** cuando existe su `RESULTADO_NNN.md`.
- Si Code no puede completar algo (permiso, secreto, ambigüedad), lo deja escrito en
  `RESULTADO_NNN.md` en vez de improvisar, y avisa por ahí.
- Numeración: nunca se reutiliza un número. El siguiente encargo toma el número libre
  más alto + 1.
- `EJECUCIONES.md` es el histórico permanente; los `PROMPT_NNN`/`RESULTADO_NNN` son el
  ida y vuelta de cada encargo.
