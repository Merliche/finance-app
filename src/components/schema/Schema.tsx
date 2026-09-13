import type { Schema as SchemaSpec } from "../../domain/parcours/types";
import type { ThemeParcours } from "../../theme/parcoursTheme";
import { CarteSchema } from "./CarteSchema";
import { SchemaBarres } from "./SchemaBarres";
import { SchemaCourbes } from "./SchemaCourbes";
import { SchemaFlux } from "./SchemaFlux";
import { SchemaRepartition } from "./SchemaRepartition";

/** Point d'entrée : un bloc `schema` du contenu devient une carte animée, selon son `kind`. */
export function Schema({ schema, theme }: { schema: SchemaSpec; theme: ThemeParcours }) {
  return (
    <CarteSchema titre={schema.titre} legende={schema.legende} theme={theme}>
      {(largeur, cle) => {
        switch (schema.kind) {
          case "courbes":
            return <SchemaCourbes key={cle} schema={schema} theme={theme} largeur={largeur} />;
          case "barres":
            return <SchemaBarres key={cle} schema={schema} theme={theme} />;
          case "repartition":
            return <SchemaRepartition key={cle} schema={schema} theme={theme} />;
          case "flux":
            return <SchemaFlux key={cle} schema={schema} theme={theme} />;
        }
      }}
    </CarteSchema>
  );
}
