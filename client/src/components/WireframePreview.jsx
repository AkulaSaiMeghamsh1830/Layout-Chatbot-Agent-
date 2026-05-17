export default function WireframePreview({ layout }) {
  if (!layout || !layout.rootNodes?.length) return null;

  const rootId = layout.rootNodes[0];
  const artboard = layout.nodes[rootId];
  if (!artboard) return null;

  const aspectRatio = artboard.height / artboard.width;

  return (
    <div className="wireframe-wrapper">
      <div className="wireframe-label">
        <span className="wireframe-badge">{artboard.name || 'Artboard'}</span>
        <span className="wireframe-dims">{Math.round(artboard.width)} × {Math.round(artboard.height)}</span>
      </div>
      <div
        className="wireframe-canvas"
        style={{
          paddingBottom: `${aspectRatio * 100}%`,
          backgroundColor: artboard.data?.backgroundColor || '#1a1a2e',
        }}
      >
        <div className="wireframe-inner">
          {artboard.children?.map((id) => {
            const node = layout.nodes[id];
            if (!node) return null;
            return <WireframeNode key={id} node={node} />;
          })}
        </div>
      </div>
    </div>
  );
}

function WireframeNode({ node }) {
  const style = {
    position: 'absolute',
    left: `${node.nx * 100}%`,
    top: `${node.ny * 100}%`,
    width: `${node.nw * 100}%`,
    height: `${node.nh * 100}%`,
  };

  if (node.type === 'image') {
    if (node.data?.sourceUrl) {
      return (
        <div style={style} className="wf-node wf-node--image">
          <img
            src={node.data.sourceUrl}
            alt={node.name}
            style={{ width: '100%', height: '100%', objectFit: node.data.fit || 'cover', display: 'block' }}
          />
          <span className="wf-label">{node.name}</span>
        </div>
      );
    }
    return (
      <div style={style} className="wf-node wf-node--image-placeholder">
        <span className="wf-label">{node.name}</span>
      </div>
    );
  }

  if (node.type === 'text') {
    const color = node.style?.visual?.color?.value;
    const fontWeight = node.style?.visual?.fontWeight;
    const fontStyle = node.style?.visual?.fontStyle;
    const fontFamily = node.style?.visual?.fontFamily;
    const textAlign = node.style?.visual?.textAlign || 'left';

    // fluid font size via container query; wireframe-canvas has container-type: inline-size
    const sizeVal = node.fontSizeRatio
      ? `${node.fontSizeRatio * 100}cqi`
      : `${(node.style?.visual?.fontSize || 16) / 10}px`;

    const lines = (node.data?.content || '').split('\n').map(l => l.trim());

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflow: 'visible',
        }}
        className="wf-node wf-node--text"
      >
        {lines.map((line, i) => (
          <span
            key={i}
            style={{
              width: '100%',
              display: 'block',
              textAlign: textAlign,
              color: color || '#ffffff',
              fontWeight: fontWeight || 400,
              fontStyle: fontStyle || 'normal',
              fontSize: sizeVal,
              fontFamily: fontFamily || 'Arial, sans-serif',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'visible',
            }}
          >
            {line}
          </span>
        ))}
      </div>
    );
  }

  if (node.type === 'shape') {
    const fill = node.style?.visual?.fill?.value;
    const isCircle = node.data?.shapeType === 'circle';
    return (
      <div
        style={{
          ...style,
          backgroundColor: fill || '#F4CF1B',
          borderRadius: isCircle ? '50%' : '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="wf-node wf-node--shape"
      >
        <span className="wf-label wf-label--dark">{node.name}</span>
      </div>
    );
  }

  return null;
}
