/** Motorista ativo do cadastro, com as placas (as placas vão para o romaneio). */
export type MotoristaOpcao = { id: string; nome: string; placaCaminhao: string; placaJulieta: string | null };

/** Escolha do motorista na saída de pacotes (controlado com `value`/`onChange` ou por `name` num formulário). */
export function SeletorMotorista({
  id,
  motoristas,
  name,
  value,
  onChange,
}: {
  id: string;
  motoristas: MotoristaOpcao[];
  name?: string;
  value?: string;
  onChange?: (id: string) => void;
}) {
  return (
    <div>
      <label htmlFor={id}>Motorista</label>
      <select
        id={id}
        name={name}
        className="campo"
        {...(onChange ? { value, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value) } : { defaultValue: "" })}
      >
        <option value="">— Sem motorista cadastrado —</option>
        {motoristas.map((m) => (
          <option key={m.id} value={m.id}>
            {m.nome} · {m.placaCaminhao}
            {m.placaJulieta ? ` + ${m.placaJulieta}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
