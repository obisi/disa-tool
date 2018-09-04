import React from 'react'
import { connect } from 'react-redux'
import { PropTypes } from 'prop-types'
import { Container, Form, Button, Icon, Loader, Grid, Accordion, List, Pagination } from 'semantic-ui-react'
import asyncAction from '../../utils/asyncAction'

import { adminGetUsers, adminChangeGlobalRole } from './actions/persons'
import { adminChangeCourseRole } from './actions/coursePersons'

import AddToCourseForm from './components/AddToCourseForm'

class AdminPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      getAll: false,
      loading: false,
      activeIndex: -1,
      activePage: 1
    }
  }

  handleSubmit = async (event) => {
    const studentInfo = event.target.userInfo.value
    if (!this.state.getAll && studentInfo === '') {
      await this.props.dispatchToast({
        type: '',
        payload: {
          toast: 'Syötä hakuparametri tai valitse kaikki',
          type: 'error'
        }
      })
      return
    }
    this.setState({
      loading: true
    })
    await this.props.adminGetUsers({
      studentInfo: this.state.getAll ? undefined : studentInfo,
      getAll: this.state.getAll
    })
    this.setState({ loading: false, activePage: 1 })
  }

  handleClick = (e, titleProps) => {
    const { index } = titleProps
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? -1 : index
    this.setState({ activeIndex: newIndex })
  }

  handlePaginationChange = (e, { activePage }) => this.setState({ activePage })

  toggleEdit = () => this.setState({ edit: !this.state.edit })

  changeRole = async (personId, courseInstanceId, role) => {
    if (courseInstanceId) {
      await this.props.adminChangeCourseRole({
        personId,
        courseInstanceId,
        role
      })
    } else {
      await this.props.adminChangeGlobalRole({ personId, role })
    }
  }

  render() {
    const { activeIndex, activePage } = this.state
    return (
      <Container style={{ paddingTop: '100px' }} >
        <Grid divided="vertically">
          <Grid.Row columns={2}>
            <Grid.Column width={8}>
              <Form onSubmit={this.handleSubmit}>
                <h2>Hallinnoi käyttäjiä</h2>

                <Form.Field width={8}>
                  <input name="userInfo" disabled={this.state.getAll} placeholder="(Hae nimellä tai opiskelijanumerolla)" />
                </Form.Field>
                <Form.Checkbox name="getAll" onChange={() => this.setState({ getAll: !this.state.getAll })} label="Hae kaikki käyttäjät" />
                <Button><Icon name="search" />Hae</Button>
              </Form>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={10}>
              {this.state.loading ?
                <Loader active />
                :
                null
              }

              {this.props.users.length > 0 ?
                <Accordion fluid styled>
                  {this.props.users.slice((activePage - 1) * 20, activePage * 20).map(u =>
                    (
                      <div key={u.id}>
                        <Accordion.Title
                          active={activeIndex === u.id}
                          index={u.id}
                          onClick={this.handleClick}
                        >
                          <Icon name="dropdown" />
                          {u.name}
                        </Accordion.Title>
                        <Accordion.Content active={activeIndex === u.id}>
                          <List divided>
                            <List.Item>
                              <List.Header>Roolit kursseilla</List.Header>
                            </List.Item>
                            {u.course_people.map(ucp => (
                              <List.Item key={ucp.id}>
                                <List.Content floated="right">
                                  {ucp.role === 'STUDENT' ?
                                    <div>
                                      <Button.Group>
                                        <Button color="green" >Student</Button>
                                        <Button
                                          onClick={() => this.changeRole(u.id, ucp.course_instance_id, 'TEACHER')}
                                          inverted
                                          color="green"
                                        >
                                          Teacher
                                        </Button>
                                      </Button.Group>
                                    </div>
                                    :
                                    <Button.Group>
                                      <Button
                                        onClick={() => this.changeRole(u.id, ucp.course_instance_id, 'STUDENT')}
                                        inverted
                                        color="green"
                                      >
                                        Student
                                      </Button>
                                      <Button color="green" >Teacher</Button>
                                    </Button.Group>
                                  }
                                </List.Content>
                                <List.Content>
                                  {ucp.course_instance.name}
                                </List.Content>
                              </List.Item>
                            ))}
                            <List.Item>
                              <AddToCourseForm person={u} />
                            </List.Item>
                            <List.Item>
                              <List.Content floated="right">
                                {u.role === 'STUDENT' ?
                                  <Button.Group>
                                    <Button color="green" >Student</Button>
                                    <Button
                                      onClick={() => this.changeRole(u.id, null, 'TEACHER')}
                                      inverted
                                      color="green"
                                    >
                                      Teacher
                                    </Button>
                                  </Button.Group>
                                  :
                                  <Button.Group>
                                    <Button
                                      onClick={() => this.changeRole(u.id, null, 'STUDENT')}
                                      inverted
                                      color="green"
                                    >
                                      Student
                                    </Button>
                                    <Button color="green" >Teacher</Button>
                                  </Button.Group>
                                }
                              </List.Content>
                              <List.Content>
                                GLOBAL ROLE
                              </List.Content>
                            </List.Item>
                          </List>
                        </Accordion.Content>
                      </div>
                    ))}
                </Accordion>

                :
                null
              }
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={5} />
            <Grid.Column width={8}>
              {this.props.users.length > 20 ?
                <Pagination
                  activePage={activePage}
                  onPageChange={this.handlePaginationChange}
                  totalPages={Math.ceil(this.props.users.length / 20)}
                />
                :
                null
              }
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Container >
    )
  }
}

AdminPage.propTypes = {
  dispatchToast: PropTypes.func.isRequired,
  users: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  adminGetUsers: PropTypes.func.isRequired,
  adminChangeCourseRole: PropTypes.func.isRequired,
  adminChangeGlobalRole: PropTypes.func.isRequired
}

const mapStateToProps = state => ({
  users: state.admin.users
})

const mapDispatchToProps = dispatch => ({
  adminGetUsers: asyncAction(adminGetUsers, dispatch),
  adminChangeCourseRole: asyncAction(adminChangeCourseRole, dispatch),
  adminChangeGlobalRole: asyncAction(adminChangeGlobalRole, dispatch),
  dispatchToast: data => dispatch(data)
})

export default connect(mapStateToProps, mapDispatchToProps)(AdminPage)
