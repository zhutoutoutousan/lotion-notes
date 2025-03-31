"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

interface Node {
  id: string
  group: number
}

interface Link {
  source: string
  target: string
  value: number
}

interface GraphData {
  nodes: Node[]
  links: Link[]
}

// Sample data for the knowledge graph
const data: GraphData = {
  nodes: [
    { id: "Project Ideas", group: 1 },
    { id: "AI Research", group: 2 },
    { id: "Meeting Notes", group: 1 },
    { id: "Machine Learning Concepts", group: 3 },
    { id: "Team Members", group: 4 },
    { id: "Product Roadmap", group: 1 },
    { id: "Client Requirements", group: 5 },
    { id: "Technical Documentation", group: 3 },
    { id: "Design System", group: 6 },
    { id: "User Feedback", group: 5 },
    { id: "Competitor Analysis", group: 7 },
    { id: "Market Research", group: 7 },
    { id: "Budget Planning", group: 8 },
    { id: "Resource Allocation", group: 8 },
    { id: "Timeline", group: 1 },
  ],
  links: [
    { source: "Project Ideas", target: "AI Research", value: 3 },
    { source: "Project Ideas", target: "Meeting Notes", value: 2 },
    { source: "AI Research", target: "Machine Learning Concepts", value: 5 },
    { source: "Meeting Notes", target: "Team Members", value: 2 },
    { source: "Project Ideas", target: "Product Roadmap", value: 4 },
    { source: "Product Roadmap", target: "Client Requirements", value: 3 },
    { source: "Machine Learning Concepts", target: "Technical Documentation", value: 2 },
    { source: "Project Ideas", target: "Design System", value: 1 },
    { source: "Client Requirements", target: "User Feedback", value: 3 },
    { source: "Project Ideas", target: "Competitor Analysis", value: 2 },
    { source: "Competitor Analysis", target: "Market Research", value: 4 },
    { source: "Product Roadmap", target: "Budget Planning", value: 2 },
    { source: "Budget Planning", target: "Resource Allocation", value: 3 },
    { source: "Product Roadmap", target: "Timeline", value: 2 },
    { source: "Resource Allocation", target: "Team Members", value: 2 },
  ],
}

interface ForceGraphProps {
  zoom?: number
}

export default function ForceGraph({ zoom = 1 }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous graph
    svg.selectAll("*").remove()

    // Create a simulation with several forces
    const simulation = d3
      .forceSimulation(data.nodes as d3.SimulationNodeDatum[])
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))

    // Apply zoom
    const g = svg.append("g").attr("transform", `scale(${zoom})`)

    // Define color scale for node groups
    const color = d3.scaleOrdinal(d3.schemeCategory10)

    // Add links
    const link = g
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", (d) => Math.sqrt(d.value))

    // Add nodes
    const node = g
      .append("g")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 10)
      .attr("fill", (d) => color(d.group.toString()))
      .call(d3.drag<SVGCircleElement, Node>().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)

    // Add node labels
    const labels = g
      .append("g")
      .attr("class", "labels")
      .selectAll("text")
      .data(data.nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .attr("dy", 20)
      .text((d) => d.id)
      .attr("font-size", "8px")
      .attr("pointer-events", "none")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y)

      labels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    // Cleanup
    return () => {
      simulation.stop()
    }
  }, [zoom])

  return <svg ref={svgRef} width="100%" height="100%" />
}

