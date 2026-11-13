import type { Metadata } from "next";
import { EMPRESA } from "@/lib/empresa";
import { RETENCAO } from "@/lib/retencao";

export const metadata: Metadata = { title: "Política de Privacidade", alternates: { canonical: "/privacidade" } };

const ATUALIZADA = "13/11/2026";

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-stone-200 py-8">
      <h2 className="text-xl font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-stone-700 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}

/** Política de Privacidade (LGPD — Lei 13.709/2018) do site e do sistema da Artepinus. */
export default function PrivacidadePage() {
  const c = EMPRESA.contato;
  const enc = EMPRESA.encarregado;
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-marca-700">LGPD · Lei 13.709/2018</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight">Política de Privacidade</h1>
      <p className="mt-3 text-sm text-stone-500">Atualizada em {ATUALIZADA}</p>
      <p className="mt-8 text-lg leading-relaxed text-stone-700">
        Esta política explica quais dados pessoais a {EMPRESA.razaoSocial} trata no seu site e no seu sistema interno, para quê, por quanto tempo e como você pode exercer os seus
        direitos.
      </p>

      <Secao titulo="Quem é o controlador">
        <p>
          {EMPRESA.razaoSocial}, CNPJ {EMPRESA.cnpj}, {c.endereco}, {c.cidade}. Telefone {c.telefone}
          {c.email ? ` · e-mail ${c.email}` : ""}.
        </p>
      </Secao>

      {/* Só mostra o encarregado que estiver preenchido em EMPRESA.encarregado (nada de nome ou e-mail inventado) */}
      <Secao titulo="Encarregado pelo tratamento de dados">
        <p>
          {enc.nome ? `O encarregado pelo tratamento de dados pessoais é ${enc.nome}. ` : ""}
          {enc.email
            ? `Fale com o encarregado pelo e-mail ${enc.email}.`
            : `Para assuntos de dados pessoais, fale com a empresa pelo telefone ${c.telefone}${c.email ? ` ou pelo e-mail ${c.email}` : ""}, ou no endereço acima.`}
        </p>
      </Secao>

      <Secao titulo="Site institucional">
        <p>
          O site não tem formulários, não pede cadastro e não usa cookies de publicidade ou de rastreamento. Os servidores registram dados técnicos de acesso (como endereço IP e
          navegador) apenas para segurança e funcionamento.
        </p>
        <p>
          A página de rastreabilidade aberta pelo QR Code das etiquetas mostra apenas dados do produto (origem florestal, datas de produção, secagem e expedição), sem nomes de
          clientes, funcionários ou motoristas.
        </p>
      </Secao>

      <Secao titulo="Sistema interno (colaboradores)">
        <p>Para os colaboradores com acesso ao sistema, tratamos:</p>
        <ul>
          <li>Nome, login, perfil de acesso e senha (guardada de forma irreversível, nunca em texto);</li>
          <li>Pergunta de segurança e a resposta (também guardada de forma irreversível), se você cadastrar;</li>
          <li>Registros de uso: quem lançou ou alterou cada informação, quando e, nos acessos, de qual endereço IP;</li>
          <li>Dados de aparelho para avisos no celular, se você ativar as notificações.</li>
        </ul>
        <p>
          <b>Finalidades:</b> dar acesso ao sistema, controlar a produção, a rastreabilidade, a expedição e a manutenção dos equipamentos, manter a segurança (inclusive o
          bloqueio de tentativas repetidas de senha) e registrar a responsabilidade por cada lançamento. <b>Bases legais:</b> execução do contrato de trabalho ou de prestação de serviço, cumprimento de obrigações
          legais e legítimo interesse da empresa na segurança e na organização da produção.
        </p>
      </Secao>

      <Secao titulo="Manutenção dos equipamentos">
        <p>No módulo de Manutenção, o sistema registra também:</p>
        <ul>
          <li>Quem abriu cada requisição de manutenção, quem ficou responsável pelo atendimento e quem mudou cada status, com data e hora;</li>
          <li>Os comentários escritos nas requisições, com o autor, a data e a hora;</li>
          <li>
            As fotos anexadas do problema e do serviço, que podem mostrar o local de trabalho e pessoas. Antes de guardar, o sistema reduz a foto e apaga os dados
            escondidos no arquivo (metadados, como a localização por GPS e o modelo do aparelho);
          </li>
          <li>As horas trabalhadas por cada pessoa da manutenção em cada requisição (início, duração e o que foi feito);</li>
          <li>Os equipamentos, setores e paradas de máquina ligados a cada requisição (dados das máquinas, não das pessoas).</li>
        </ul>
        <p>
          Comentários, fotos e horas só aparecem para quem entra no sistema e usa o módulo de Manutenção. O total de horas por pessoa aparece nos
          indicadores da manutenção, que só gerentes, supervisores e o administrador do sistema veem.
        </p>
        <p>
          <b>Finalidades:</b> pedir, organizar e acompanhar a manutenção das máquinas e instalações, registrar o que foi feito e por quem, planejar as manutenções
          preventivas, medir o tempo de máquina parada e a carga de trabalho da equipe e manter o histórico de cada equipamento. <b>Bases legais:</b> execução do
          contrato de trabalho ou de prestação de serviço e legítimo interesse da empresa na segurança, na conservação dos equipamentos e na organização do trabalho.
        </p>
      </Secao>

      <Secao titulo="Motoristas, fornecedores e clientes">
        <p>A equipe da empresa cadastra no sistema:</p>
        <ul>
          <li>Motoristas que transportam toras e cargas: nome, telefone e placas do caminhão e da julieta;</li>
          <li>Fornecedores e produtores de madeira: nome, CPF ou CNPJ e telefone;</li>
          <li>Clientes: o nome do cliente nos pedidos e nos pacotes.</li>
        </ul>
        <p>
          Como histórico do que foi registrado em cada dia, o nome e as placas do motorista ficam copiados nas cargas de toras e nos romaneios, e o nome do fornecedor ou da
          floresta de origem, nas cargas.
        </p>
        <p>
          <b>Finalidades:</b> receber as toras, rastrear a madeira da origem à entrega, expedir os pedidos e emitir os documentos da carga (como o romaneio). <b>Bases legais:</b>{" "}
          execução dos contratos de compra, transporte e venda, cumprimento de obrigações legais e fiscais e legítimo interesse da empresa na rastreabilidade e na organização
          da produção.
        </p>
      </Secao>

      <Secao titulo="Cookies e armazenamento no aparelho">
        <ul>
          <li>Cookie de sessão (essencial): mantém você conectado ao sistema por até 30 dias; sem ele não é possível entrar.</li>
          <li>
            Cookie de preferência com o último módulo usado (guardado por até 1 ano) e, no próprio aparelho, o tema claro/escuro, se você dispensou o convite de notificações e
            qual foi o último usuário a entrar (para apagar as telas guardadas quando outra pessoa entra).
          </li>
          <li>
            Para funcionar sem internet, o aparelho guarda as telas de apontamento da serraria, a tela de nova requisição de manutenção e páginas do manual
            (com os dados que elas mostram), além dos lançamentos e requisições feitos sem internet, inclusive fotos, até serem enviados. Tudo isso é apagado ao tocar em
            Sair.
          </li>
        </ul>
      </Secao>

      <Secao titulo="Por quanto tempo guardamos">
        <ul>
          <li>Contador do limite de tentativas de senha (login e IP, usado só para o bloqueio): {RETENCAO.tentativasDias} dia.</li>
          <li>
            Registros de acesso na auditoria (entradas e saídas, tentativas de login sem sucesso, bloqueios e tentativas de recuperação de senha, com o usuário ou o login
            digitado, a data, a hora e o IP): {RETENCAO.acessosDias} dias.
          </li>
          <li>Notificações já lidas: {RETENCAO.notificacoesLidasDias} dias.</li>
          <li>Registros de alterações (auditoria), inclusive o valor anterior dos cadastros alterados: {RETENCAO.auditoriaAnos} anos.</li>
          <li>Dados de produção, rastreabilidade e expedição: enquanto forem necessários à atividade e às obrigações legais e fiscais.</li>
          <li>
            Requisições de manutenção, com fotos, comentários, horas trabalhadas e histórico: enquanto forem necessárias ao histórico dos equipamentos e às obrigações
            legais.
          </li>
          <li>Conta de usuário: enquanto houver vínculo; depois é desativada.</li>
        </ul>
        <p>A exclusão dos registros que passam do prazo é feita automaticamente, todos os dias.</p>
      </Secao>

      <Secao titulo="Com quem compartilhamos">
        <p>
          Os dados ficam em serviços contratados para operar o site e o sistema, com acesso protegido: a hospedagem é da Vercel Inc. e o banco de dados é o Prisma Postgres, da
          Prisma Data, Inc. Os servidores desses serviços podem ficar fora do Brasil, então os dados podem ser armazenados e processados em outros países.
        </p>
        <p>
          Se você ativar os avisos no celular, eles são entregues pelo serviço de notificações do seu navegador (como Google, Apple ou Mozilla); o conteúdo do aviso vai
          cifrado.
        </p>
        <p>
          Não vendemos dados pessoais. Dados de expedição (romaneio e nota fiscal) são compartilhados com clientes e transportadores na medida necessária à entrega.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Conexão criptografada (HTTPS), senhas guardadas de forma irreversível, limite de tentativas de senha, acesso por perfil e registro de todas as alterações. Ao trocar a
          senha, as sessões abertas em outros aparelhos são encerradas.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>Nos termos da LGPD (arts. 18 e 20), você pode pedir:</p>
        <ul>
          <li>confirmação de que tratamos os seus dados e acesso a eles;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desacordo com a lei;</li>
          <li>portabilidade dos dados a outro fornecedor de serviço ou produto, conforme a regulamentação da ANPD;</li>
          <li>informação sobre as entidades públicas e privadas com as quais compartilhamos os seus dados;</li>
          <li>
            quando o tratamento depender do seu consentimento: informação sobre a possibilidade de não consentir e sobre as consequências da negativa, revogação do
            consentimento e eliminação dos dados tratados com base nele, salvo quando a lei exigir a guarda;
          </li>
          <li>oposição a tratamento feito em desacordo com a lei;</li>
          <li>revisão de decisões tomadas unicamente com base em tratamento automatizado.</li>
        </ul>
        <p>
          Para exercer esses direitos, fale com a empresa pelo telefone {c.telefone}
          {c.email ? ` ou pelo e-mail ${c.email}` : ""}
          {enc.email ? `, com o encarregado pelo e-mail ${enc.email}` : ""}, ou no endereço acima. Você também pode peticionar à Autoridade Nacional de Proteção de Dados
          (ANPD).
        </p>
      </Secao>
    </div>
  );
}
