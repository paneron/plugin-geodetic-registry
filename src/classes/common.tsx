/** @jsx jsx */
/** @jsxFrag React.Fragment */

import update from 'immutability-helper';
import React, { ReactChildren, ReactNode, useState } from 'react';
import { jsx, css } from '@emotion/react';

import {
  Button,
  Classes,
  Colors, ControlGroup, FormGroup, H4, H6, InputGroup,
  NumericInput, Tag, TextArea, UL,
} from '@blueprintjs/core';
import {
  Citation, ItemClassConfiguration,
  ItemDetailView,
  ItemEditView,
} from '@riboseinc/paneron-registry-kit/types';
import { PropertyDetailView } from '@riboseinc/paneron-registry-kit/views/util';


export interface CommonGRItemData {
  name: string
  identifier: number
  description: string | null
  remarks: string
  informationSources: Citation[]
}


export const DEFAULTS: CommonGRItemData = {
  name: '',
  identifier: 0,
  informationSources: [],
  remarks: '',
  description: '',
};


function getInformationSourceStub(): Citation {
  return {
    title: '',
    seriesIssueID: null,
    seriesName: null,
    seriesPage: null,
    edition: null,
    editionDate: null,
    otherDetails: '',
    isbn: null,
    issn: null,
  };
}


export interface Extent {
  n: number
  e: number
  s: number
  w: number
  name: string
}
export const DEFAULT_EXTENT: Extent = { name: '', n: 0, e: 0, s: 0, w: 0 };
export const ExtentEdit: React.FC<{ extent: Extent, onChange?: (ext: Extent) => void }> =
function ({ extent, onChange }) {
  function extentInput(side: 'n' | 'e' | 's' | 'w') {
    const nm = side === 'n' || side === 's' ? 'Lat' : 'Lon';

    return (
      <CoordInput
        key={side}
        onChange={onChange
          ? (val) => onChange!({ ...extent, [side]: val })
          : undefined}
        leftIcon={<Tag minimal>{side.toUpperCase()} {nm}</Tag>}
        value={extent[side] ?? 0}
      />
    );
  }
  return (
    <>
      <ControlGroup fill>
        {extentInput('n')}
        {extentInput('e')}
        {extentInput('s')}
        {extentInput('w')}
      </ControlGroup>
      <TextArea
        disabled={!onChange}
        onChange={(evt) => onChange!({ ...extent, name: evt.currentTarget.value })}
        value={extent.name ?? ''}
        css={css`margin-top: .5em; font-size: 90%; width: 100%;`}
      />
    </>
  );
};


const CoordInput: React.FC<{
  value: number
  onChange?: (newVal: number) => void
  leftIcon?: JSX.Element
}> =
function ({ value, leftIcon, onChange }) {

  const [editedVal, editVal] = useState<string | null>(value.toLocaleString());
  const [valid, setValid] = useState(true);

  function handleChange(val: string) {
    if (!onChange) {
      return;
    }
    let normalizedVal: string = val.trim();
    try {
      const candidate = parseFloat(normalizedVal);
      if (!isNaN(candidate) && candidate.toLocaleString() === normalizedVal) {
        setValid(true);
        onChange(candidate);
        editVal(null);
      } else {
        editVal(normalizedVal);
        setValid(false);
      }
    } catch (e) {
      editVal(normalizedVal);
      setValid(false);
    }
  }

  return (
    <InputGroup
      readOnly={!onChange}
      onChange={(evt: React.FormEvent<HTMLInputElement>) =>
        handleChange(evt.currentTarget.value)}
      leftIcon={leftIcon}
      css={css`.bp3-input { ${valid ? 'background: honeydew' : 'background: mistyrose'} }`}
      value={editedVal ?? value.toLocaleString()}
    />
  );
}


export const AliasesDetail: React.FC<{ aliases: string[] }> = function ({ aliases }) {
  return <PropertyDetailView title="Aliases">
    <UL>
      {aliases.map((a, idx) => <li key={idx}>{a}</li>)}
    </UL>
  </PropertyDetailView>;
};


export const COMMON_PROPERTIES: Pick<ItemClassConfiguration<CommonGRItemData>, 'itemSorter'> = {
  itemSorter: (a, b) => a.identifier - b.identifier,
};


export const EditView: ItemEditView<CommonGRItemData> = function ({ itemData, onChange, children }) {
  function textInputProps
  <F extends keyof Omit<CommonGRItemData, 'informationSource'>>
  (fieldName: F) {
    return {
      disabled: !onChange,
      onChange: (evt: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!onChange) { return; }
        onChange({ ...itemData, [fieldName]: evt.currentTarget.value })
      },
    }
  }

  return (
    <SplitView
        aside={<>

          <FormGroup label="Description:">
            <TextArea fill required value={itemData.description ?? ''} {...textInputProps('description')} />
          </FormGroup>

          <FormGroup label="Remarks:">
            <TextArea fill required value={itemData.remarks} {...textInputProps('remarks')} />
          </FormGroup>

          {itemData.informationSources.length > 0
            ? <H4 css={css`margin-top: 1.5em;`}>
                Information sources
              </H4>
            : null}

          <UL css={css`padding-left: 0; list-style: square;`}>
            {itemData.informationSources.map((infoSource, idx) =>
              <li key={idx} css={css`margin-top: 1em;`}>
                <FormGroup
                    label={`Source ${idx + 1}:`}
                    labelInfo={<Button
                        small
                        disabled={!onChange}
                        onClick={() => onChange!(update(itemData, { informationSources: { $splice: [[ idx, 1 ]] } }))}>
                      Delete
                    </Button>}>
                  <InformationSourceEdit
                    citation={infoSource}
                    onChange={onChange
                      ? (infoSource) => onChange!(update(itemData, { informationSources: { [idx]: { $set: infoSource } } }))
                      : undefined}
                  />
                </FormGroup>
              </li>
            )}
          </UL>

          <Button
              outlined
              disabled={!onChange}
              onClick={() => onChange!(update(itemData, { informationSources: { $push: [getInformationSourceStub()] } }))}
              icon="add">
            Append source
          </Button>

        </>}>

      <FormGroup label="GR identifier:">
        <NumericInput
          required
          value={itemData.identifier}
          disabled={!onChange}
          onValueChange={onChange
            ? (val) => (onChange ? onChange({ ...itemData, identifier: val }) : void 0)
            : undefined}
        />
      </FormGroup>

      <FormGroup label="Name:">
        <InputGroup required value={itemData.name} {...textInputProps('name')} />
      </FormGroup>

      {children}

    </SplitView>
  );
};


const SimpleField: React.FC<{ val: string, label: string, onChange?: (newVal: string) => void }> =
function ({ val, label, onChange }) {
  return (
    <FormGroup label={`${label}:`}>
      <InputGroup
        readOnly={!onChange}
        value={val}
        onChange={(evt: React.FormEvent<HTMLInputElement>) => onChange!(evt.currentTarget.value)}
      />
    </FormGroup>
  );
};


const InformationSourceEdit: React.FC<{ citation: Citation, onChange?: (newCitation: Citation) => void }> =
function ({ citation, onChange }) {
  return (
    <>
      <SimpleField label="Title" val={citation.title} onChange={onChange ? (title) => onChange!({ ...citation, title }) : undefined} />
      <SimpleField label="Series issue ID" val={citation.seriesIssueID ?? ''} onChange={onChange ? (seriesIssueID) => onChange!({ ...citation, seriesIssueID }) : undefined} />
      <SimpleField label="Series name" val={citation.seriesName ?? ''} onChange={onChange ? (seriesName) => onChange!({ ...citation, seriesName }) : undefined} />
      <SimpleField label="Series page" val={citation.seriesPage ?? ''} onChange={onChange ? (seriesPage) => onChange!({ ...citation, seriesPage }) : undefined} />
      <SimpleField label="Edition" val={citation.edition ?? ''} onChange={onChange ? (edition) => onChange!({ ...citation, edition }) : undefined} />
      <SimpleField label="Other details" val={citation.otherDetails ?? ''} onChange={onChange ? (otherDetails) => onChange!({ ...citation, otherDetails }) : undefined} />
      <SimpleField label="ISBN" val={citation.isbn ?? ''} onChange={onChange ? (isbn) => onChange!({ ...citation, isbn }) : undefined} />
      <SimpleField label="ISSN" val={citation.issn ?? ''} onChange={onChange ? (issn) => onChange!({ ...citation, issn }) : undefined} />
    </>
  );
};


export const ListItemView: ItemClassConfiguration<CommonGRItemData>["views"]["listItemView"] =
(props) => (
  <span className={props.className}>
    <span css={css`color: ${Colors.GRAY4}; font-family: monospace; font-size: 90%`}>
      {props.itemData.identifier}
    </span>
    &emsp;
    {props.itemData.name}
  </span>
);



export const InformationSourceDetails: React.FC<{
  source: Citation
  className?: string
}> = function ({ source, className }) {

  const DLEntry: React.FC<{ t: string, d: string }> = function ({ t, d }) {
    return <>
      <dt>{t}</dt>
      <dd>{d}</dd>
    </>
  }

  let editionDate: string;
  try {
    editionDate = source.editionDate?.toLocaleDateString() ?? '';
  } catch (e) {
    editionDate = '';
  }


  return (
    <article className={className}>

      <H6 style={{ margin: '.5em 0 0 0' }}>{source.title}</H6>

      {source.otherDetails ? <p style={{ margin: '.5em 0 0 0' }}>Citation details: {source.otherDetails}</p> : null}

      <dl css={css`
          display: flex; flex-flow: row wrap;
          margin: 0;
          font-size: 85%;

          &:not(:empty) {
            border-bottom: .25em ${Colors.LIGHT_GRAY3} solid;
          }
          dt, dd {
            margin: .25em 0 0 0;
            border-top: .25em ${Colors.LIGHT_GRAY3} dotted;
          }
          dt {
            flex-basis: 30%;
          }
          dd style: italic;
            flex-basis: 70%;
            padding-right: 1em;
          }
        `}>
        {source.edition ? <DLEntry t="Edition" d={source.edition} /> : null}
        {source.editionDate ? <DLEntry t="Edition date" d={editionDate} /> : null}

        {source.seriesName ? <DLEntry t="Series name" d={source.seriesName} /> : null}
        {source.seriesIssueID ? <DLEntry t="Issue" d={source.seriesIssueID} /> : null}
        {source.seriesPage ? <DLEntry t="Page(s)" d={source.seriesPage} /> : null}

        {source.issn ? <DLEntry t="ISSN" d={source.issn} /> : null}
        {source.isbn ? <DLEntry t="ISBN" d={source.isbn} /> : null}
      </dl>

    </article>
  );
};


export const DetailView: ItemDetailView<CommonGRItemData> = (props) => {
  const data = props.itemData;

  return (
    <SplitView
        className={props.className}
        aside={<>
          {data.description
            ? <PropertyDetailView title="Description">
                <p>{data.description}</p>
              </PropertyDetailView>
            : null}

          {data.remarks
            ? <PropertyDetailView title="Remarks">
                <p>{data.remarks}</p>
              </PropertyDetailView>
            : null}

          {(data.informationSources || []).length > 0
            ? <PropertyDetailView title="Information sources">
                <UL css={css`padding-left: 0; list-style: square;`}>
                  {data.informationSources.map((s, idx) =>
                    <li key={idx}>
                      <InformationSourceDetails source={s} />
                    </li>)}
                </UL>
              </PropertyDetailView>
            : null}
        </>}>
      {props.children}
    </SplitView>
  )
};


const SplitView: React.FC<{
  aside?: ReactChildren | ReactNode
  className?: string
}> = function ({ children, aside, className }) {
  return (
    <div css={css`
        position: absolute; top: 0rem; left: 0rem; right: 0rem; bottom: 0rem;

        display: flex; flex-flow: row nowrap; overflow: hidden;

        @media (max-width: 1000px) {
          flex-flow: column nowrap;
        }

        & > * { padding: 1rem; }`} className={className}>

      <div css={css`overflow-y: auto; flex: 1;`}>
        {children}
      </div>

      <aside
          css={css`
            overflow-y: auto;
            flex-basis: 45%; background: ${Colors.LIGHT_GRAY4};
          `}
          className={Classes.ELEVATION_1}>
        {aside}
      </aside>
    </div>
  );
}
